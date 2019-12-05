import React from 'react';

const Button: React.FC<{
  handleClick: () => void;
  [key: string]: any;
}> = React.forwardRef(({ handleClick, children, ...props }, ref): JSX.Element => (
  <button className="btn" {...props} onClick={handleClick}>{children}</button>
));

export default Button;
