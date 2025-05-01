
import React from 'react';
import { Navigate } from 'react-router-dom';

const ItemsView = () => {
  // This is a redirect component to ensure we use the correct items page
  return <Navigate to="/items/view" replace />;
};

export default ItemsView;
