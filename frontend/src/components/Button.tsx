import { AiOutlineSend } from "react-icons/ai";

 interface Props{
    // text:string
    onClick: (event: React.FormEvent)=>void
 }

const Button = ({ onClick}:Props) => {
  return (
    <div
    onClick={onClick}
    className="cursor-pointer bg-[#513c68] w-7 h-7 min-w-7 min-h-7 rounded-full flex items-center justify-center hover:bg-[#FEA5CB] transition-all  aspect-w-1 aspect-h-1"
  >
    <AiOutlineSend className="text-white text-xl" />
  </div>
  )
}

export default Button