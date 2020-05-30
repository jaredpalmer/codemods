import * as React from 'react';

export interface ButtonProps {}

export const Button: React.FC<ButtonProps> = ({ children }) => {
  return <button>{children}</button>;
};

Button.displayName = 'Button';
