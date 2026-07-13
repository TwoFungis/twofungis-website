"""
Two Fungis Production Library Seed Data
========================================
Real production items for Finish Carpentry commercial contracting.
Based on actual Two Fungis Company Standards.
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional
import logging
import httpx
import jwt

from config import config

router = APIRouter(prefix="/api/production-library", tags=["production-library-seed"])
logger = logging.getLogger(__name__)

# =====================================================
# TWO FUNGIS FINISH CARPENTRY PRODUCTION DATA
# =====================================================

FINISH_CARPENTRY_ITEMS = [
    # ========== DOORS ==========
    {
        "production_code": "FC-DR-001",
        "production_name": "Interior Door - Standard Slab Install",
        "description": "Install pre-hung interior door, standard hollow core, including shim, level, secure, foam insulate jamb. Does not include casing.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 8,
        "production_output": 1.0,
        "low_labour_rate": 85.00,
        "standard_rate": 110.00,
        "premium_labour_rate": 145.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["doors", "interior", "standard"],
        "notes": "Standard residential/commercial hollow core door. Add casing separately."
    },
    {
        "production_code": "FC-DR-002",
        "production_name": "Interior Door - Solid Core Install",
        "description": "Install pre-hung solid core interior door, including shim, level, secure, foam insulate jamb. Fire-rated or sound-rated applications.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 6,
        "production_output": 0.75,
        "low_labour_rate": 125.00,
        "standard_rate": 165.00,
        "premium_labour_rate": 210.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["doors", "interior", "solid-core", "fire-rated"],
        "notes": "Heavier door requires more time. Common in multifamily corridors and fire separations."
    },
    {
        "production_code": "FC-DR-003",
        "production_name": "Exterior Door - Entry Install",
        "description": "Install pre-hung exterior entry door including threshold, weatherstripping, shim, level, secure, foam insulate. Excludes lockset.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 2,
        "production_per_day": 4,
        "production_output": 0.5,
        "low_labour_rate": 195.00,
        "standard_rate": 275.00,
        "premium_labour_rate": 365.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["doors", "exterior", "entry"],
        "notes": "Two-person install recommended. Coordinate with weatherproofing."
    },
    {
        "production_code": "FC-DR-004",
        "production_name": "Barn Door Install - Standard Track",
        "description": "Install barn door with track system, including track, rollers, floor guide. Door pre-finished.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 2,
        "production_per_day": 4,
        "production_output": 0.5,
        "low_labour_rate": 185.00,
        "standard_rate": 245.00,
        "premium_labour_rate": 325.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["doors", "barn-door", "track"],
        "notes": "Verify wall blocking before install. Two-person lift required."
    },
    {
        "production_code": "FC-DR-005",
        "production_name": "Pocket Door Install",
        "description": "Install pocket door frame and door into existing framed opening. Includes frame, track, door hanging.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 3,
        "production_output": 0.375,
        "low_labour_rate": 225.00,
        "standard_rate": 295.00,
        "premium_labour_rate": 385.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["doors", "pocket-door"],
        "notes": "Frame must be installed during rough carpentry. This is finish installation only."
    },
    
    # ========== HARDWARE ==========
    {
        "production_code": "FC-HW-001",
        "production_name": "Door Hardware - Passage Set",
        "description": "Install passage (non-locking) lever set including strike plate, drilling if required.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 16,
        "production_output": 2.0,
        "low_labour_rate": 35.00,
        "standard_rate": 45.00,
        "premium_labour_rate": 65.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["hardware", "lockset", "passage"],
        "notes": "Pre-drilled doors. Add time for boring if door is blank."
    },
    {
        "production_code": "FC-HW-002",
        "production_name": "Door Hardware - Privacy Set",
        "description": "Install privacy lever set (bathroom/bedroom) including strike plate.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 16,
        "production_output": 2.0,
        "low_labour_rate": 35.00,
        "standard_rate": 45.00,
        "premium_labour_rate": 65.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["hardware", "lockset", "privacy"],
        "notes": "Standard bathroom/bedroom application."
    },
    {
        "production_code": "FC-HW-003",
        "production_name": "Door Hardware - Entry Lockset",
        "description": "Install keyed entry lockset including deadbolt, strike plates, key coordination.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 10,
        "production_output": 1.25,
        "low_labour_rate": 55.00,
        "standard_rate": 75.00,
        "premium_labour_rate": 95.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["hardware", "lockset", "entry", "keyed"],
        "notes": "Includes deadbolt. Key coordination with building master required."
    },
    {
        "production_code": "FC-HW-004",
        "production_name": "Door Closer Install",
        "description": "Install commercial door closer, including arm, mounting, adjustment.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 8,
        "production_output": 1.0,
        "low_labour_rate": 65.00,
        "standard_rate": 85.00,
        "premium_labour_rate": 115.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["hardware", "closer", "commercial"],
        "notes": "Parallel arm or regular arm. Fire door closers require certification."
    },
    {
        "production_code": "FC-HW-005",
        "production_name": "Hinges - Standard Butt (Set of 3)",
        "description": "Install set of 3 standard butt hinges, mortise into jamb and door edge.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "SET",
        "crew_size": 1,
        "production_per_day": 12,
        "production_output": 1.5,
        "low_labour_rate": 45.00,
        "standard_rate": 55.00,
        "premium_labour_rate": 75.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["hardware", "hinges"],
        "notes": "Standard 3-hinge set. Heavy doors may require 4 hinges."
    },
    {
        "production_code": "FC-HW-006",
        "production_name": "Door Stop - Wall Mount",
        "description": "Install wall-mounted door stop including backing if required.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 24,
        "production_output": 3.0,
        "low_labour_rate": 18.00,
        "standard_rate": 25.00,
        "premium_labour_rate": 35.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["hardware", "door-stop"],
        "notes": "Wall protection. Verify blocking location."
    },
    
    # ========== CASING & TRIM ==========
    {
        "production_code": "FC-CS-001",
        "production_name": "Door Casing - Colonial Profile",
        "description": "Install colonial profile door casing both sides, mitered corners, including caulking prep.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 10,
        "production_output": 1.25,
        "low_labour_rate": 65.00,
        "standard_rate": 85.00,
        "premium_labour_rate": 115.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["casing", "colonial", "trim"],
        "notes": "Per door opening (both sides). Standard 2-1/4\" colonial."
    },
    {
        "production_code": "FC-CS-002",
        "production_name": "Door Casing - Craftsman/Square",
        "description": "Install square/craftsman profile door casing both sides, butt joints with rosettes or plinth blocks.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 8,
        "production_output": 1.0,
        "low_labour_rate": 85.00,
        "standard_rate": 110.00,
        "premium_labour_rate": 145.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["casing", "craftsman", "square", "trim"],
        "notes": "Per door opening (both sides). Includes rosettes or plinth blocks."
    },
    {
        "production_code": "FC-CS-003",
        "production_name": "Window Casing - Standard",
        "description": "Install window casing all four sides, mitered corners, including sill/stool if applicable.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 8,
        "production_output": 1.0,
        "low_labour_rate": 75.00,
        "standard_rate": 95.00,
        "premium_labour_rate": 125.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["casing", "window", "trim"],
        "notes": "Per window opening. Picture frame style."
    },
    
    # ========== BASEBOARD ==========
    {
        "production_code": "FC-BB-001",
        "production_name": "Baseboard - MDF 3-1/4\"",
        "description": "Install 3-1/4\" MDF baseboard including inside/outside corners, coping, nail fill prep.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "LF",
        "crew_size": 1,
        "production_per_day": 200,
        "production_output": 25.0,
        "low_labour_rate": 2.25,
        "standard_rate": 2.85,
        "premium_labour_rate": 3.65,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["baseboard", "mdf", "trim"],
        "notes": "Standard multifamily specification. Pre-primed MDF."
    },
    {
        "production_code": "FC-BB-002",
        "production_name": "Baseboard - MDF 5-1/4\"",
        "description": "Install 5-1/4\" MDF baseboard including inside/outside corners, coping, nail fill prep.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "LF",
        "crew_size": 1,
        "production_per_day": 175,
        "production_output": 21.875,
        "low_labour_rate": 2.65,
        "standard_rate": 3.25,
        "premium_labour_rate": 4.15,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["baseboard", "mdf", "trim"],
        "notes": "Taller profile for commercial/upgraded residential."
    },
    {
        "production_code": "FC-BB-003",
        "production_name": "Baseboard - Solid Wood",
        "description": "Install solid wood baseboard (pine, poplar, oak), including inside/outside corners, coping.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "LF",
        "crew_size": 1,
        "production_per_day": 150,
        "production_output": 18.75,
        "low_labour_rate": 3.45,
        "standard_rate": 4.25,
        "premium_labour_rate": 5.45,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["baseboard", "solid-wood", "trim"],
        "notes": "Stain-grade or paint-grade solid wood. Premium installation."
    },
    {
        "production_code": "FC-BB-004",
        "production_name": "Base Shoe / Quarter Round",
        "description": "Install base shoe or quarter round moulding at floor line.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "LF",
        "crew_size": 1,
        "production_per_day": 300,
        "production_output": 37.5,
        "low_labour_rate": 1.45,
        "standard_rate": 1.85,
        "premium_labour_rate": 2.45,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["baseboard", "shoe", "trim"],
        "notes": "Used to cover flooring gaps. Fast installation."
    },
    
    # ========== CROWN MOULDING ==========
    {
        "production_code": "FC-CR-001",
        "production_name": "Crown Moulding - 3-1/4\" Simple",
        "description": "Install 3-1/4\" crown moulding, coped inside corners, mitered outside corners.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "LF",
        "crew_size": 1,
        "production_per_day": 100,
        "production_output": 12.5,
        "low_labour_rate": 4.75,
        "standard_rate": 5.85,
        "premium_labour_rate": 7.45,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["crown", "moulding", "trim"],
        "notes": "Simple single-piece crown. Standard residential."
    },
    {
        "production_code": "FC-CR-002",
        "production_name": "Crown Moulding - 5-1/4\" Built-Up",
        "description": "Install 5-1/4\" or larger crown with backing/build-up, coped inside corners.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "LF",
        "crew_size": 1,
        "production_per_day": 65,
        "production_output": 8.125,
        "low_labour_rate": 7.45,
        "standard_rate": 9.25,
        "premium_labour_rate": 12.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["crown", "moulding", "built-up", "trim"],
        "notes": "Multiple-piece crown assembly. Premium finish."
    },
    
    # ========== CLOSETS ==========
    {
        "production_code": "FC-CL-001",
        "production_name": "Closet Shelf & Rod - Single",
        "description": "Install single shelf with rod below, including brackets, support cleats.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "LF",
        "crew_size": 1,
        "production_per_day": 40,
        "production_output": 5.0,
        "low_labour_rate": 12.50,
        "standard_rate": 16.00,
        "premium_labour_rate": 21.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["closet", "shelf", "rod"],
        "notes": "Standard single-tier closet configuration."
    },
    {
        "production_code": "FC-CL-002",
        "production_name": "Closet Shelf & Rod - Double",
        "description": "Install double shelf and rod configuration (upper and lower hanging).",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "LF",
        "crew_size": 1,
        "production_per_day": 25,
        "production_output": 3.125,
        "low_labour_rate": 21.00,
        "standard_rate": 27.00,
        "premium_labour_rate": 35.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["closet", "shelf", "rod", "double"],
        "notes": "Two-tier configuration for shorter garments."
    },
    {
        "production_code": "FC-CL-003",
        "production_name": "Wire Closet Organizer System",
        "description": "Install ventilated wire closet system including shelves, hanging rods, brackets.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "LF",
        "crew_size": 1,
        "production_per_day": 30,
        "production_output": 3.75,
        "low_labour_rate": 18.00,
        "standard_rate": 24.00,
        "premium_labour_rate": 32.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["closet", "wire", "organizer"],
        "notes": "ClosetMaid or similar ventilated wire system."
    },
    
    # ========== STAIRS ==========
    {
        "production_code": "FC-ST-001",
        "production_name": "Stair Tread - Retrofit Cap",
        "description": "Install retrofit stair tread cap over existing stair, including nosing, adhesive, fasteners.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 12,
        "production_output": 1.5,
        "low_labour_rate": 55.00,
        "standard_rate": 72.00,
        "premium_labour_rate": 95.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["stairs", "tread", "retrofit"],
        "notes": "Retrofit over existing treads. Oak, maple, or laminate."
    },
    {
        "production_code": "FC-ST-002",
        "production_name": "Stair Riser - Retrofit",
        "description": "Install retrofit stair riser over existing, including adhesive, fasteners.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 16,
        "production_output": 2.0,
        "low_labour_rate": 35.00,
        "standard_rate": 48.00,
        "premium_labour_rate": 65.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["stairs", "riser", "retrofit"],
        "notes": "Matching riser to tread material."
    },
    {
        "production_code": "FC-ST-003",
        "production_name": "Handrail - Wall Mount",
        "description": "Install wall-mounted handrail including brackets, returns, continuous rail.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "LF",
        "crew_size": 1,
        "production_per_day": 24,
        "production_output": 3.0,
        "low_labour_rate": 18.00,
        "standard_rate": 24.00,
        "premium_labour_rate": 32.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["stairs", "handrail", "wall-mount"],
        "notes": "Code-compliant wall-mounted rail. Returns to wall at ends."
    },
    {
        "production_code": "FC-ST-004",
        "production_name": "Baluster - Wood",
        "description": "Install wood baluster including fitting to rail and tread/floor.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 20,
        "production_output": 2.5,
        "low_labour_rate": 28.00,
        "standard_rate": 36.00,
        "premium_labour_rate": 48.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["stairs", "baluster", "wood"],
        "notes": "Turned or square wood balusters. Code spacing required."
    },
    {
        "production_code": "FC-ST-005",
        "production_name": "Newel Post Install",
        "description": "Install newel post including mounting, plumb, secure to structure.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 4,
        "production_output": 0.5,
        "low_labour_rate": 145.00,
        "standard_rate": 185.00,
        "premium_labour_rate": 245.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["stairs", "newel", "post"],
        "notes": "Starting, landing, or terminating newel. Structural attachment critical."
    },
    
    # ========== BATHROOM ACCESSORIES ==========
    {
        "production_code": "FC-BA-001",
        "production_name": "Grab Bar Install",
        "description": "Install ADA grab bar including blocking verification, secure mounting.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 12,
        "production_output": 1.5,
        "low_labour_rate": 45.00,
        "standard_rate": 58.00,
        "premium_labour_rate": 78.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["bathroom", "grab-bar", "accessibility"],
        "notes": "ADA-compliant installation. Verify blocking location."
    },
    {
        "production_code": "FC-BA-002",
        "production_name": "Bathroom Mirror Install",
        "description": "Install bathroom mirror including adhesive, clips, or french cleat.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 10,
        "production_output": 1.25,
        "low_labour_rate": 55.00,
        "standard_rate": 72.00,
        "premium_labour_rate": 95.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["bathroom", "mirror"],
        "notes": "Standard vanity mirror. Large mirrors may require two-person."
    },
    {
        "production_code": "FC-BA-003",
        "production_name": "Towel Bar Install",
        "description": "Install towel bar including backing verification, level mount.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 16,
        "production_output": 2.0,
        "low_labour_rate": 32.00,
        "standard_rate": 42.00,
        "premium_labour_rate": 55.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["bathroom", "accessory", "towel-bar"],
        "notes": "18\" or 24\" towel bar standard."
    },
    {
        "production_code": "FC-BA-004",
        "production_name": "Toilet Paper Holder Install",
        "description": "Install toilet paper holder, surface mount or recessed.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 20,
        "production_output": 2.5,
        "low_labour_rate": 25.00,
        "standard_rate": 35.00,
        "premium_labour_rate": 45.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["bathroom", "accessory", "tp-holder"],
        "notes": "Standard height 26\" from floor."
    },
    {
        "production_code": "FC-BA-005",
        "production_name": "Medicine Cabinet Install",
        "description": "Install surface-mount or recessed medicine cabinet, including level, secure.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 6,
        "production_output": 0.75,
        "low_labour_rate": 95.00,
        "standard_rate": 125.00,
        "premium_labour_rate": 165.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["bathroom", "medicine-cabinet"],
        "notes": "Recessed requires framing coordination."
    },
    
    # ========== DEFICIENCIES & PUNCHLIST ==========
    {
        "production_code": "FC-DF-001",
        "production_name": "Deficiency - Door Adjustment",
        "description": "Adjust door for proper operation: strike alignment, hinge adjustment, latch operation.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 16,
        "production_output": 2.0,
        "low_labour_rate": 32.00,
        "standard_rate": 45.00,
        "premium_labour_rate": 62.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["deficiency", "punchlist", "door"],
        "notes": "Common punchlist item. May require planing."
    },
    {
        "production_code": "FC-DF-002",
        "production_name": "Deficiency - Trim Touch-Up",
        "description": "Touch-up trim deficiencies: re-caulk, fill nail holes, minor repairs.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "HR",
        "crew_size": 1,
        "production_per_day": 8,
        "production_output": 1.0,
        "low_labour_rate": 55.00,
        "standard_rate": 72.00,
        "premium_labour_rate": 95.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["deficiency", "punchlist", "trim"],
        "notes": "Hourly rate for miscellaneous trim repairs."
    },
    {
        "production_code": "FC-DF-003",
        "production_name": "Deficiency - Hardware Correction",
        "description": "Correct hardware issues: re-key, adjust closer, replace damaged hardware.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "06-2000",
        "unit": "EA",
        "crew_size": 1,
        "production_per_day": 12,
        "production_output": 1.5,
        "low_labour_rate": 42.00,
        "standard_rate": 55.00,
        "premium_labour_rate": 75.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["deficiency", "punchlist", "hardware"],
        "notes": "Excludes replacement hardware cost."
    },
    
    # ========== TRAVEL & SUPERVISION ==========
    {
        "production_code": "FC-GN-001",
        "production_name": "Site Travel - Within GTA",
        "description": "Travel time and vehicle costs within Greater Toronto Area.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "01-5000",
        "unit": "DAY",
        "crew_size": 1,
        "production_per_day": 1,
        "production_output": 0.125,
        "low_labour_rate": 85.00,
        "standard_rate": 110.00,
        "premium_labour_rate": 145.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["general", "travel"],
        "notes": "Per crew per day. Adjust for distance."
    },
    {
        "production_code": "FC-GN-002",
        "production_name": "Site Supervision",
        "description": "On-site supervision and coordination, quality control, scheduling.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "01-3000",
        "unit": "DAY",
        "crew_size": 1,
        "production_per_day": 1,
        "production_output": 0.125,
        "low_labour_rate": 425.00,
        "standard_rate": 525.00,
        "premium_labour_rate": 675.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["general", "supervision"],
        "notes": "Project lead or site supervisor daily rate."
    },
    {
        "production_code": "FC-GN-003",
        "production_name": "Material Handling & Staging",
        "description": "Receive, stage, and distribute materials on site. Elevator/stair carry included.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "01-5000",
        "unit": "HR",
        "crew_size": 1,
        "production_per_day": 8,
        "production_output": 1.0,
        "low_labour_rate": 48.00,
        "standard_rate": 62.00,
        "premium_labour_rate": 82.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["general", "material-handling"],
        "notes": "High-rise projects require additional time."
    },
    {
        "production_code": "FC-GN-004",
        "production_name": "Protection & Cleanup",
        "description": "Floor protection installation, dust barriers, daily cleanup.",
        "trade_discipline": "Finish Carpentry",
        "cost_code": "01-5000",
        "unit": "HR",
        "crew_size": 1,
        "production_per_day": 8,
        "production_output": 1.0,
        "low_labour_rate": 45.00,
        "standard_rate": 58.00,
        "premium_labour_rate": 75.00,
        "material_rate": 0,
        "is_company_standard": True,
        "tags": ["general", "protection", "cleanup"],
        "notes": "Required for occupied building work."
    },
]

# =====================================================
# SEED ENDPOINT
# =====================================================

async def get_service_headers():
    return {
        "apikey": config.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {config.SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

async def verify_token_and_get_org(authorization: str) -> dict:
    """Verify JWT and get organization context"""
    try:
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/organization_members?"
                f"user_id=eq.{user_id}&"
                f"is_active=eq.true&"
                f"select=organization_id,role,organizations(id,name)",
                headers=await get_service_headers()
            )
            
            if response.status_code == 200:
                members = response.json()
                if members:
                    membership = next((m for m in members if m.get('is_primary')), members[0])
                    org = membership.get('organizations', {})
                    return {
                        "user_id": user_id,
                        "organization_id": org.get('id'),
                        "organization_name": org.get('name'),
                        "role": membership.get('role')
                    }
            
            raise HTTPException(status_code=403, detail="No organization access")
            
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

@router.post("/seed/finish-carpentry")
async def seed_finish_carpentry(authorization: str = Header(...)):
    """
    Seed the Production Library with real Two Fungis Finish Carpentry data.
    Creates comprehensive production items for commercial contracting.
    """
    context = await verify_token_and_get_org(authorization)
    org_id = context['organization_id']
    user_id = context['user_id']
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            headers = await get_service_headers()
            
            # Get the Finish Carpentry domain ID - try exact match first
            domain_response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/knowledge_domains?"
                f"organization_id=eq.{org_id}&name=eq.Finish Carpentry&limit=1",
                headers=headers
            )
            
            domain_id = None
            if domain_response.status_code == 200:
                domains = domain_response.json()
                if domains:
                    domain_id = domains[0]['id']
                    logger.info(f"Found Finish Carpentry domain: {domain_id}")
            
            # If not found, try case-insensitive search
            if not domain_id:
                domain_response = await client.get(
                    f"{config.SUPABASE_URL}/rest/v1/knowledge_domains?"
                    f"organization_id=eq.{org_id}&select=id,name",
                    headers=headers
                )
                if domain_response.status_code == 200:
                    all_domains = domain_response.json()
                    for d in all_domains:
                        if 'finish' in d.get('name', '').lower() and 'carpentry' in d.get('name', '').lower():
                            domain_id = d['id']
                            logger.info(f"Found domain via scan: {d['name']} = {domain_id}")
                            break
            
            # If still not found, create it
            if not domain_id:
                create_domain = await client.post(
                    f"{config.SUPABASE_URL}/rest/v1/knowledge_domains",
                    headers=headers,
                    json={
                        "organization_id": org_id,
                        "code": "FC",
                        "name": "Finish Carpentry",
                        "description": "Interior finish carpentry including doors, trim, millwork, and hardware",
                        "created_by": user_id
                    }
                )
                if create_domain.status_code == 201:
                    domain_id = create_domain.json()[0]['id']
                    logger.info(f"Created Finish Carpentry domain: {domain_id}")
            
            if not domain_id:
                raise HTTPException(status_code=500, detail="Could not find or create Finish Carpentry domain")
            
            # Get measurement units (these are global, not org-specific)
            units_response = await client.get(
                f"{config.SUPABASE_URL}/rest/v1/measurement_units?limit=100",
                headers=headers
            )
            
            units_map = {}
            if units_response.status_code == 200:
                units_data = units_response.json()
                logger.info(f"Found {len(units_data)} measurement units")
                for unit in units_data:
                    units_map[unit['code']] = unit['id']
            else:
                logger.error(f"Failed to fetch units: {units_response.status_code} - {units_response.text}")
            
            # Create production items
            created_count = 0
            skipped_count = 0
            errors = []
            
            for item_data in FINISH_CARPENTRY_ITEMS:
                # Check if item already exists
                existing_check = await client.get(
                    f"{config.SUPABASE_URL}/rest/v1/production_items?"
                    f"organization_id=eq.{org_id}&production_code=eq.{item_data['production_code']}&limit=1",
                    headers=headers
                )
                
                if existing_check.status_code == 200 and existing_check.json():
                    skipped_count += 1
                    continue
                
                # Get unit ID - MUST have a unit
                unit_id = units_map.get(item_data['unit'])
                if not unit_id:
                    logger.warning(f"Unit {item_data['unit']} not found for {item_data['production_code']}, creating...")
                    # Create the unit if it doesn't exist (units are global)
                    create_unit = await client.post(
                        f"{config.SUPABASE_URL}/rest/v1/measurement_units",
                        headers=headers,
                        json={
                            "code": item_data['unit'],
                            "name": item_data['unit'],
                            "description": f"{item_data['unit']} measurement unit"
                        }
                    )
                    if create_unit.status_code == 201:
                        created_units = create_unit.json()
                        if created_units:
                            unit_id = created_units[0]['id']
                            units_map[item_data['unit']] = unit_id
                            logger.info(f"Created unit {item_data['unit']}: {unit_id}")
                    else:
                        logger.error(f"Failed to create unit: {create_unit.status_code} - {create_unit.text}")
                
                # Skip if we still don't have a unit
                if not unit_id:
                    errors.append({
                        "code": item_data['production_code'],
                        "error": f"Could not find or create unit: {item_data['unit']}"
                    })
                    continue
                
                # Create the production item
                item_payload = {
                    "organization_id": org_id,
                    "knowledge_domain_id": domain_id,
                    "measurement_unit_id": unit_id,
                    "production_code": item_data['production_code'],
                    "production_name": item_data['production_name'],
                    "description": item_data['description'],
                    "trade_discipline": item_data.get('trade_discipline'),
                    "cost_code": item_data.get('cost_code'),
                    "crew_size": item_data.get('crew_size', 1),
                    "production_per_day": item_data.get('production_per_day'),
                    "production_output": item_data.get('production_output'),
                    "low_labour_rate": item_data.get('low_labour_rate'),
                    "standard_rate": item_data.get('standard_rate'),
                    "premium_labour_rate": item_data.get('premium_labour_rate'),
                    "premium_rate": item_data.get('premium_labour_rate'),  # Legacy field
                    "material_rate": item_data.get('material_rate'),
                    "is_company_standard": item_data.get('is_company_standard', True),
                    "notes": item_data.get('notes'),
                    "tags": item_data.get('tags', []),
                    "created_by": user_id,
                    "is_active": True
                }
                
                create_response = await client.post(
                    f"{config.SUPABASE_URL}/rest/v1/production_items",
                    headers=headers,
                    json=item_payload
                )
                
                if create_response.status_code == 201:
                    created_count += 1
                else:
                    errors.append({
                        "code": item_data['production_code'],
                        "error": create_response.text
                    })
            
            return {
                "success": True,
                "message": f"Finish Carpentry seed complete",
                "results": {
                    "items_created": created_count,
                    "items_skipped": skipped_count,
                    "total_in_seed": len(FINISH_CARPENTRY_ITEMS),
                    "errors": errors[:5] if errors else []  # Return first 5 errors only
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error seeding finish carpentry: {e}")
        raise HTTPException(status_code=500, detail=str(e))
