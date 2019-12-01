import React from 'react';

const Button: React.FC<{
  handleClick: () => void;
}> = React.forwardRef(({ handleClick, children }, ref): JSX.Element => (
  <button className="btn" onClick={handleClick}>{children}</button>
));

export default Button;
