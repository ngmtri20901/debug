import React, { ReactNode } from 'react';
import LoadingState from './LoadingState';

interface PageWithLoadingProps {
  children: ReactNode;
  isLoading: boolean;
}

const PageWithLoading: React.FC<PageWithLoadingProps> = ({ children, isLoading }) => {
  return (
    <>
      {isLoading && <LoadingState />}
      {children}
    </>
  );
};

export default PageWithLoading; 