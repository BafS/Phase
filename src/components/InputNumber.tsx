import React, { BaseSyntheticEvent } from 'react';

const InputNumber: React.FC<{
  defaultValue: string|number;
  min: number;
  max: number;
  handleChange: (e: BaseSyntheticEvent) => void;
}> = ({
  defaultValue,
  handleChange,
  min = undefined,
  max = undefined,
}): JSX.Element => (
  <input
    className="input"
    min={min}
    max={max}
    type="number"
    placeholder="Search"
    defaultValue={defaultValue}
    onChange={handleChange}
  />
);

export default InputNumber;
