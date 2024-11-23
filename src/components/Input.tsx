import React from 'react'; 
import Button from './Button';

interface InputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent) => void;
}

const Input: React.FC<InputProps> = ({ value, onChange, onSubmit }) => {
  return (
    <form onSubmit={onSubmit} className="flex items-center bg-[#3c2c4d] p-2 rounded-full shadow-md">
 
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="flex-grow p-2 rounded-full bg-[#3c2c4d] text-white outline-none transition-all"
        placeholder="Type a message..."
      /> 
      <Button onClick={onSubmit}/>
    </form>
  );
};

export default Input;
