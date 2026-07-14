"""
TradeOS Import Engine v2.0
==========================

Reusable platform infrastructure for all bulk imports.
Designed to be generic enough for future imports:
- Production Library
- Clients
- Suppliers
- Price Books
- Equipment Libraries
- Company Brain datasets

Architecture:
- ValidationEngine: Separates critical errors from auto-fixable issues
- AliasMapper: Centralized alias mapping for any field type
- LookupResolver: Case-insensitive lookup matching with auto-creation
- DuplicateHandler: Skip/Update/Replace strategies
- TransactionManager: All-or-nothing commits
- ImportReporter: Comprehensive import summaries
"""

from typing import Optional, List, Dict, Any, Callable, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timezone
import logging
import re

logger = logging.getLogger(__name__)


class DuplicateStrategy(str, Enum):
    """How to handle duplicate records"""
    SKIP = "skip"       # Skip existing, import only new
    UPDATE = "update"   # Update existing with new values (merge)
    REPLACE = "replace" # Replace existing entirely


class ValidationSeverity(str, Enum):
    """Severity levels for validation issues"""
    CRITICAL = "critical"   # Blocks import entirely
    WARNING = "warning"     # Import proceeds but user is warned
    INFO = "info"           # Informational only


@dataclass
class ValidationIssue:
    """A single validation issue"""
    row: int
    column: str
    value: str
    severity: ValidationSeverity
    issue: str
    recommended_fix: str
    auto_fixed: bool = False
    auto_fix_value: Optional[str] = None


@dataclass
class LookupCreation:
    """Record of an auto-created lookup value"""
    lookup_type: str  # e.g., "knowledge_domain", "service_category"
    original_value: str
    created_id: str
    created_name: str


@dataclass
class UnitMapping:
    """Record of a measurement unit alias mapping"""
    row: int
    original_unit: str
    mapped_to: str
    mapped_unit_id: str


@dataclass
class ImportRow:
    """A processed import row ready for commit"""
    row_number: int
    data: Dict[str, Any]
    is_duplicate: bool = False
    existing_id: Optional[str] = None
    warnings: List[ValidationIssue] = field(default_factory=list)


@dataclass
class ValidationResult:
    """Complete validation result for an import"""
    success: bool
    total_rows: int
    valid_rows: int
    error_rows: int
    warning_rows: int
    
    # Grouped issues
    critical_errors: List[ValidationIssue] = field(default_factory=list)
    auto_created_lookups: List[LookupCreation] = field(default_factory=list)
    unit_mappings: List[UnitMapping] = field(default_factory=list)
    warnings: List[ValidationIssue] = field(default_factory=list)
    
    # Preview data
    preview_items: List[ImportRow] = field(default_factory=list)
    
    # New lookups to be created (pending)
    pending_domains: List[Dict[str, Any]] = field(default_factory=list)
    pending_categories: List[Dict[str, Any]] = field(default_factory=list)
    
    # Duplicates found
    duplicates_found: int = 0
    duplicate_codes: List[str] = field(default_factory=list)


@dataclass
class ImportResult:
    """Complete import result"""
    success: bool
    message: str
    duration_ms: int
    
    # Counts
    imported: int = 0
    updated: int = 0
    skipped: int = 0
    
    # Created lookups
    domains_created: int = 0
    categories_created: int = 0
    unit_conversions: int = 0
    
    # Issues
    warnings: int = 0
    errors: int = 0
    error_details: List[Dict[str, Any]] = field(default_factory=list)
    
    # Created lookup details
    created_lookups: List[LookupCreation] = field(default_factory=list)


class MeasurementUnitAliasMapper:
    """
    Centralized measurement unit alias mapping.
    Maps common variations to standard TradeOS units.
    """
    
    # Standard TradeOS units and their aliases
    ALIAS_TABLE = {
        # EACH / UNIT
        "EA": ["EA", "EACH", "UNIT", "UNITS", "PC", "PCS", "PIECE", "PIECES", "U", "QTY"],
        # LINEAR FEET
        "LF": ["LF", "LIN FT", "LINEAR FT", "LINEAR FEET", "LINEAL FT", "LINEAL FEET", "FT", "FEET", "L.F.", "LIN.FT."],
        # SQUARE FEET
        "SF": ["SF", "SQ FT", "SQFT", "SQ", "SQUARE FT", "SQUARE FEET", "S.F.", "SQ.FT.", "FT2", "FT²"],
        # LUMP SUM
        "LS": ["LS", "LUMP SUM", "LUMPSUM", "LUMP", "L.S.", "LOT", "ALLOW", "ALLOWANCE"],
        # DAY
        "DAY": ["DAY", "DAYS", "D", "PER DAY", "/DAY", "DY"],
        # HOUR
        "HR": ["HR", "HOUR", "HOURS", "HRS", "H", "PER HOUR", "/HR", "/HOUR"],
        # SET
        "SET": ["SET", "SETS", "ST"],
        # KIT
        "KIT": ["KIT", "KITS"],
        # PAIR
        "PAIR": ["PAIR", "PAIRS", "PR", "PRS"],
        # COST (pass-through)
        "COST": ["COST", "COSTS", "$", "DOLLAR", "DOLLARS", "AMT", "AMOUNT"],
        # Additional common construction units
        "CY": ["CY", "CUBIC YD", "CUBIC YARD", "CUBIC YARDS", "CU YD", "YD3", "YD³"],
        "GAL": ["GAL", "GALLON", "GALLONS"],
        "TON": ["TON", "TONS", "T"],
        "LB": ["LB", "LBS", "POUND", "POUNDS"],
        "BF": ["BF", "BOARD FT", "BOARD FEET", "BOARD FOOT", "B.F."],
    }
    
    def __init__(self):
        # Build reverse lookup
        self._reverse_lookup = {}
        for standard_unit, aliases in self.ALIAS_TABLE.items():
            for alias in aliases:
                self._reverse_lookup[alias.upper()] = standard_unit
    
    def map_unit(self, input_unit: str) -> Tuple[str, bool]:
        """
        Map an input unit to a standard TradeOS unit.
        
        Returns:
            Tuple of (mapped_unit, was_aliased)
            - mapped_unit: The standard unit code
            - was_aliased: True if the input was different from the standard
        """
        if not input_unit:
            return (None, False)
        
        normalized = input_unit.strip().upper()
        
        # Direct match
        if normalized in self._reverse_lookup:
            standard = self._reverse_lookup[normalized]
            return (standard, standard != normalized)
        
        # Not found
        return (None, False)
    
    def get_valid_units(self) -> List[str]:
        """Get list of all valid standard units"""
        return list(self.ALIAS_TABLE.keys())
    
    def is_valid_unit(self, unit: str) -> bool:
        """Check if a unit (or alias) is valid"""
        if not unit:
            return False
        return unit.strip().upper() in self._reverse_lookup


class LookupResolver:
    """
    Case-insensitive lookup matching with auto-creation support.
    """
    
    def __init__(self):
        self._domains = {}  # name_lower -> {id, name, code}
        self._categories = {}  # name_lower -> {id, name, code}
        self._units = {}  # code_upper -> {id, code, name}
        
        # Track lookups to be created
        self._pending_domains = {}  # name_lower -> {name, code}
        self._pending_categories = {}  # name_lower -> {name, code}
    
    def load_domains(self, domains: List[Dict[str, Any]]):
        """Load existing domains for lookup"""
        self._domains.clear()
        for d in domains:
            name_lower = d['name'].lower().strip()
            self._domains[name_lower] = {
                'id': d['id'],
                'name': d['name'],
                'code': d.get('code', '')
            }
            if d.get('code'):
                self._domains[d['code'].lower().strip()] = self._domains[name_lower]
    
    def load_categories(self, categories: List[Dict[str, Any]]):
        """Load existing categories for lookup"""
        self._categories.clear()
        for c in categories:
            name_lower = c['name'].lower().strip()
            self._categories[name_lower] = {
                'id': c['id'],
                'name': c['name'],
                'code': c.get('code', '')
            }
            if c.get('code'):
                self._categories[c['code'].lower().strip()] = self._categories[name_lower]
    
    def load_units(self, units: List[Dict[str, Any]]):
        """Load existing measurement units for lookup"""
        self._units.clear()
        for u in units:
            code_upper = u['code'].upper().strip()
            self._units[code_upper] = {
                'id': u['id'],
                'code': u['code'],
                'name': u['name']
            }
    
    def resolve_domain(self, value: str, auto_create: bool = True) -> Tuple[Optional[str], bool, Optional[str]]:
        """
        Resolve a domain name/code to an ID.
        
        Returns:
            Tuple of (domain_id, was_auto_created, canonical_name)
        """
        if not value:
            return (None, False, None)
        
        value_lower = value.strip().lower()
        
        # Check existing
        if value_lower in self._domains:
            d = self._domains[value_lower]
            return (d['id'], False, d['name'])
        
        # Check pending
        if value_lower in self._pending_domains:
            pd = self._pending_domains[value_lower]
            return (f"pending:{value_lower}", True, pd['name'])
        
        # Auto-create if enabled
        if auto_create:
            # Generate a code from the name
            canonical_name = value.strip().title()
            code = self._generate_code(canonical_name)
            
            self._pending_domains[value_lower] = {
                'name': canonical_name,
                'code': code
            }
            return (f"pending:{value_lower}", True, canonical_name)
        
        return (None, False, None)
    
    def resolve_category(self, value: str, auto_create: bool = True) -> Tuple[Optional[str], bool, Optional[str]]:
        """
        Resolve a category name/code to an ID.
        
        Returns:
            Tuple of (category_id, was_auto_created, canonical_name)
        """
        if not value:
            return (None, False, None)
        
        value_lower = value.strip().lower()
        
        # Check existing
        if value_lower in self._categories:
            c = self._categories[value_lower]
            return (c['id'], False, c['name'])
        
        # Check pending
        if value_lower in self._pending_categories:
            pc = self._pending_categories[value_lower]
            return (f"pending:{value_lower}", True, pc['name'])
        
        # Auto-create if enabled
        if auto_create:
            canonical_name = value.strip().title()
            code = self._generate_code(canonical_name)
            
            self._pending_categories[value_lower] = {
                'name': canonical_name,
                'code': code
            }
            return (f"pending:{value_lower}", True, canonical_name)
        
        return (None, False, None)
    
    def resolve_unit(self, code: str) -> Optional[str]:
        """Resolve a unit code to an ID (no auto-create for controlled enum)"""
        if not code:
            return None
        
        code_upper = code.strip().upper()
        if code_upper in self._units:
            return self._units[code_upper]['id']
        
        return None
    
    def get_pending_domains(self) -> List[Dict[str, Any]]:
        """Get domains that need to be created"""
        return [
            {'name': d['name'], 'code': d['code']}
            for d in self._pending_domains.values()
        ]
    
    def get_pending_categories(self) -> List[Dict[str, Any]]:
        """Get categories that need to be created"""
        return [
            {'name': c['name'], 'code': c['code']}
            for c in self._pending_categories.values()
        ]
    
    def register_created_domain(self, name_lower: str, domain_id: str, name: str, code: str):
        """Register a newly created domain"""
        self._domains[name_lower] = {
            'id': domain_id,
            'name': name,
            'code': code
        }
        if code:
            self._domains[code.lower()] = self._domains[name_lower]
        
        # Remove from pending
        if name_lower in self._pending_domains:
            del self._pending_domains[name_lower]
    
    def register_created_category(self, name_lower: str, category_id: str, name: str, code: str):
        """Register a newly created category"""
        self._categories[name_lower] = {
            'id': category_id,
            'name': name,
            'code': code
        }
        if code:
            self._categories[code.lower()] = self._categories[name_lower]
        
        # Remove from pending
        if name_lower in self._pending_categories:
            del self._pending_categories[name_lower]
    
    def _generate_code(self, name: str) -> str:
        """Generate a code from a name (first letters of each word)"""
        words = name.split()
        if len(words) == 1:
            return name[:3].upper()
        return ''.join(w[0].upper() for w in words[:4])


class ProductionLibraryValidator:
    """
    Validator specific to Production Library imports.
    """
    
    # Column name mapping (allow various formats)
    COLUMN_MAPPING = {
        'production code': 'production_code',
        'production_code': 'production_code',
        'code': 'production_code',
        'production name': 'production_name',
        'production_name': 'production_name',
        'name': 'production_name',
        'knowledge domain': 'knowledge_domain',
        'knowledge_domain': 'knowledge_domain',
        'domain': 'knowledge_domain',
        'service categories': 'service_categories',
        'service_categories': 'service_categories',
        'categories': 'service_categories',
        'measurement unit': 'measurement_unit',
        'measurement_unit': 'measurement_unit',
        'unit': 'measurement_unit',
        'uom': 'measurement_unit',
        'production per day': 'production_per_day',
        'production_per_day': 'production_per_day',
        'per day': 'production_per_day',
        'output': 'production_per_day',
        'crew size': 'crew_size',
        'crew_size': 'crew_size',
        'crew': 'crew_size',
        'labour hours': 'labour_hours',
        'labour_hours': 'labour_hours',
        'labor hours': 'labour_hours',
        'hours': 'labour_hours',
        'standard rate': 'standard_rate',
        'standard_rate': 'standard_rate',
        'std rate': 'standard_rate',
        'rate': 'standard_rate',
        'premium rate': 'premium_rate',
        'premium_rate': 'premium_rate',
        'prem rate': 'premium_rate',
        'complex rate': 'complex_rate',
        'complex_rate': 'complex_rate',
        'company standard': 'is_company_standard',
        'is_company_standard': 'is_company_standard',
        'standard': 'is_company_standard',
        'notes': 'notes',
        'description': 'description',
    }
    
    def __init__(self):
        self.unit_mapper = MeasurementUnitAliasMapper()
        self.lookup_resolver = LookupResolver()
    
    def normalize_row(self, row: Dict[str, str]) -> Dict[str, str]:
        """Normalize column names and clean values"""
        normalized = {}
        for key, value in row.items():
            norm_key = self.COLUMN_MAPPING.get(
                key.lower().strip(),
                key.lower().strip().replace(' ', '_')
            )
            normalized[norm_key] = (value or '').strip()
        return normalized
    
    def parse_numeric(self, value: str) -> Tuple[Optional[float], bool]:
        """
        Parse a numeric value from string.
        Returns (parsed_value, had_error)
        """
        if not value:
            return (None, False)
        
        try:
            # Clean common formats
            cleaned = value.replace(',', '').replace('$', '').replace('%', '').strip()
            return (float(cleaned), False)
        except ValueError:
            return (None, True)
    
    def parse_boolean(self, value: str) -> bool:
        """Parse a boolean value from string"""
        return value.lower().strip() in ('true', 'yes', '1', 'y', 'x', 'checked')
    
    def validate_row(
        self,
        row_num: int,
        row: Dict[str, str],
        seen_codes: set,
        existing_codes: set
    ) -> Tuple[Optional[ImportRow], List[ValidationIssue], List[UnitMapping]]:
        """
        Validate a single row.
        
        Returns:
            Tuple of (ImportRow or None, list of issues, list of unit mappings)
        """
        issues = []
        unit_mappings = []
        
        # Normalize row
        normalized = self.normalize_row(row)
        
        # ===== REQUIRED FIELD VALIDATION =====
        
        # Production Code
        production_code = normalized.get('production_code', '')
        if not production_code:
            issues.append(ValidationIssue(
                row=row_num,
                column="Production Code",
                value="",
                severity=ValidationSeverity.CRITICAL,
                issue="Required field is empty",
                recommended_fix="Enter a unique code like 'FC-001' or 'DH-001'"
            ))
        elif len(production_code) > 50:
            issues.append(ValidationIssue(
                row=row_num,
                column="Production Code",
                value=production_code[:20] + "...",
                severity=ValidationSeverity.CRITICAL,
                issue=f"Code too long ({len(production_code)} chars, max 50)",
                recommended_fix="Shorten the production code"
            ))
        elif production_code.upper() in seen_codes:
            issues.append(ValidationIssue(
                row=row_num,
                column="Production Code",
                value=production_code,
                severity=ValidationSeverity.CRITICAL,
                issue="Duplicate code in file",
                recommended_fix=f"Change to a unique code. '{production_code}' already appears in this file"
            ))
        
        # Production Name
        production_name = normalized.get('production_name', '')
        if not production_name:
            issues.append(ValidationIssue(
                row=row_num,
                column="Production Name",
                value="",
                severity=ValidationSeverity.CRITICAL,
                issue="Required field is empty",
                recommended_fix="Enter a descriptive name like 'Door Casing Installation'"
            ))
        elif len(production_name) > 255:
            issues.append(ValidationIssue(
                row=row_num,
                column="Production Name",
                value=production_name[:30] + "...",
                severity=ValidationSeverity.CRITICAL,
                issue=f"Name too long ({len(production_name)} chars, max 255)",
                recommended_fix="Shorten the production name"
            ))
        
        # Knowledge Domain (auto-create if missing)
        knowledge_domain = normalized.get('knowledge_domain', '')
        domain_id = None
        domain_auto_created = False
        
        if not knowledge_domain:
            issues.append(ValidationIssue(
                row=row_num,
                column="Knowledge Domain",
                value="",
                severity=ValidationSeverity.CRITICAL,
                issue="Required field is empty",
                recommended_fix="Enter a domain name like 'Finish Carpentry' or 'Doors & Hardware'"
            ))
        else:
            domain_id, domain_auto_created, canonical_domain = self.lookup_resolver.resolve_domain(
                knowledge_domain, 
                auto_create=True
            )
            
            if domain_auto_created:
                issues.append(ValidationIssue(
                    row=row_num,
                    column="Knowledge Domain",
                    value=knowledge_domain,
                    severity=ValidationSeverity.INFO,
                    issue=f"Domain '{knowledge_domain}' will be auto-created",
                    recommended_fix="This domain doesn't exist and will be created automatically",
                    auto_fixed=True,
                    auto_fix_value=canonical_domain
                ))
        
        # Measurement Unit (use alias mapping, NO auto-create)
        measurement_unit = normalized.get('measurement_unit', '')
        unit_id = None
        
        if not measurement_unit:
            issues.append(ValidationIssue(
                row=row_num,
                column="Measurement Unit",
                value="",
                severity=ValidationSeverity.CRITICAL,
                issue="Required field is empty",
                recommended_fix=f"Enter a valid unit: {', '.join(self.unit_mapper.get_valid_units())}"
            ))
        else:
            # Try alias mapping first
            mapped_unit, was_aliased = self.unit_mapper.map_unit(measurement_unit)
            
            if mapped_unit:
                unit_id = self.lookup_resolver.resolve_unit(mapped_unit)
                
                if was_aliased:
                    unit_mappings.append(UnitMapping(
                        row=row_num,
                        original_unit=measurement_unit,
                        mapped_to=mapped_unit,
                        mapped_unit_id=unit_id or ""
                    ))
                    issues.append(ValidationIssue(
                        row=row_num,
                        column="Measurement Unit",
                        value=measurement_unit,
                        severity=ValidationSeverity.INFO,
                        issue=f"Unit '{measurement_unit}' mapped to standard unit '{mapped_unit}'",
                        recommended_fix="Unit alias automatically converted",
                        auto_fixed=True,
                        auto_fix_value=mapped_unit
                    ))
                
                if not unit_id:
                    issues.append(ValidationIssue(
                        row=row_num,
                        column="Measurement Unit",
                        value=measurement_unit,
                        severity=ValidationSeverity.CRITICAL,
                        issue=f"Unit '{mapped_unit}' not found in database",
                        recommended_fix="Run Production Library initialization to create standard units"
                    ))
            else:
                issues.append(ValidationIssue(
                    row=row_num,
                    column="Measurement Unit",
                    value=measurement_unit,
                    severity=ValidationSeverity.CRITICAL,
                    issue=f"'{measurement_unit}' is not a valid unit or alias",
                    recommended_fix=f"Use one of: {', '.join(self.unit_mapper.get_valid_units())}"
                ))
        
        # ===== OPTIONAL FIELD VALIDATION =====
        
        # Numeric fields
        production_per_day, ppd_error = self.parse_numeric(normalized.get('production_per_day', ''))
        if ppd_error:
            issues.append(ValidationIssue(
                row=row_num,
                column="Production Per Day",
                value=normalized.get('production_per_day', ''),
                severity=ValidationSeverity.WARNING,
                issue="Invalid number format",
                recommended_fix="Enter a numeric value like '120' or '8.5'"
            ))
        
        crew_size, cs_error = self.parse_numeric(normalized.get('crew_size', ''))
        if cs_error:
            issues.append(ValidationIssue(
                row=row_num,
                column="Crew Size",
                value=normalized.get('crew_size', ''),
                severity=ValidationSeverity.WARNING,
                issue="Invalid number format",
                recommended_fix="Enter a numeric value like '1' or '2'"
            ))
        crew_size = crew_size or 1  # Default to 1
        
        labour_hours, lh_error = self.parse_numeric(normalized.get('labour_hours', ''))
        if lh_error:
            issues.append(ValidationIssue(
                row=row_num,
                column="Labour Hours",
                value=normalized.get('labour_hours', ''),
                severity=ValidationSeverity.WARNING,
                issue="Invalid number format",
                recommended_fix="Enter a numeric value like '0.5' or '2.0'"
            ))
        
        standard_rate, sr_error = self.parse_numeric(normalized.get('standard_rate', ''))
        if sr_error:
            issues.append(ValidationIssue(
                row=row_num,
                column="Standard Rate",
                value=normalized.get('standard_rate', ''),
                severity=ValidationSeverity.WARNING,
                issue="Invalid number format",
                recommended_fix="Enter a numeric value like '8.50' or '120.00'"
            ))
        
        premium_rate, pr_error = self.parse_numeric(normalized.get('premium_rate', ''))
        if pr_error:
            issues.append(ValidationIssue(
                row=row_num,
                column="Premium Rate",
                value=normalized.get('premium_rate', ''),
                severity=ValidationSeverity.WARNING,
                issue="Invalid number format",
                recommended_fix="Enter a numeric value like '10.50' or '150.00'"
            ))
        
        complex_rate, cr_error = self.parse_numeric(normalized.get('complex_rate', ''))
        if cr_error:
            issues.append(ValidationIssue(
                row=row_num,
                column="Complex Rate",
                value=normalized.get('complex_rate', ''),
                severity=ValidationSeverity.WARNING,
                issue="Invalid number format",
                recommended_fix="Enter a numeric value like '12.50' or '180.00'"
            ))
        
        # Rate hierarchy validation
        if standard_rate and premium_rate and premium_rate < standard_rate:
            issues.append(ValidationIssue(
                row=row_num,
                column="Premium Rate",
                value=str(premium_rate),
                severity=ValidationSeverity.WARNING,
                issue=f"Premium rate (${premium_rate}) is less than standard rate (${standard_rate})",
                recommended_fix="Premium rate should typically be higher than standard rate"
            ))
        
        if standard_rate and complex_rate and complex_rate < standard_rate:
            issues.append(ValidationIssue(
                row=row_num,
                column="Complex Rate",
                value=str(complex_rate),
                severity=ValidationSeverity.WARNING,
                issue=f"Complex rate (${complex_rate}) is less than standard rate (${standard_rate})",
                recommended_fix="Complex rate should typically be higher than standard rate"
            ))
        
        # Service Categories (auto-create if missing)
        service_category_ids = []
        service_cats_raw = normalized.get('service_categories', '')
        if service_cats_raw:
            for cat in service_cats_raw.split(','):
                cat = cat.strip()
                if cat:
                    cat_id, cat_auto_created, canonical_cat = self.lookup_resolver.resolve_category(
                        cat,
                        auto_create=True
                    )
                    if cat_id:
                        service_category_ids.append(cat_id)
                        
                        if cat_auto_created:
                            issues.append(ValidationIssue(
                                row=row_num,
                                column="Service Categories",
                                value=cat,
                                severity=ValidationSeverity.INFO,
                                issue=f"Category '{cat}' will be auto-created",
                                recommended_fix="This category doesn't exist and will be created automatically",
                                auto_fixed=True,
                                auto_fix_value=canonical_cat
                            ))
        
        # Boolean
        is_company_standard = self.parse_boolean(normalized.get('is_company_standard', ''))
        
        # Text
        notes = normalized.get('notes', '') or None
        description = normalized.get('description', '') or None
        
        # Check for critical errors
        critical_errors = [i for i in issues if i.severity == ValidationSeverity.CRITICAL]
        
        if critical_errors:
            return (None, issues, unit_mappings)
        
        # Check for duplicates against existing data
        is_duplicate = production_code.upper() in existing_codes
        
        # Build the import row
        mapped_unit, _ = self.unit_mapper.map_unit(measurement_unit)
        
        import_row = ImportRow(
            row_number=row_num,
            data={
                'production_code': production_code,
                'production_name': production_name,
                'knowledge_domain': knowledge_domain,
                'knowledge_domain_id': domain_id,
                'measurement_unit': mapped_unit or measurement_unit.upper(),
                'measurement_unit_id': unit_id,
                'service_categories': service_cats_raw,
                'service_category_ids': service_category_ids,
                'production_per_day': production_per_day,
                'crew_size': crew_size,
                'labour_hours': labour_hours,
                'standard_rate': standard_rate,
                'premium_rate': premium_rate,
                'complex_rate': complex_rate,
                'is_company_standard': is_company_standard,
                'notes': notes,
                'description': description,
            },
            is_duplicate=is_duplicate,
            existing_id=None,  # Will be resolved during commit
            warnings=[i for i in issues if i.severity == ValidationSeverity.WARNING]
        )
        
        return (import_row, issues, unit_mappings)
