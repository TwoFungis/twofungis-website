/**
 * ProductionLibraryPage.jsx - Production Library Explorer Page Wrapper
 * =====================================================================
 * 
 * This is the route handler for /app/estimating/library
 * It wraps the ProductionLibraryExplorer component.
 */

import React from 'react';
import { ProductionLibraryExplorer } from '../../../components/ProductionLibrary';

const ProductionLibraryPage = () => {
  return <ProductionLibraryExplorer />;
};

export default ProductionLibraryPage;
