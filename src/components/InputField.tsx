import { Input } from "./ui/input";

const InputField: React.FC<{
    label: string;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }> = ({ label, type = "text", value, onChange }) => (
    <div className="space-y-1">
      <label className="block text-sm font-semibold">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border-gray-300 rounded-lg shadow-sm"
      />
    </div>
  );
  
  export default InputField;
  