

interface Props{
    title: string
    author: string[]
}

const BookMessage = ({title, author}:Props) => {
  return (
    <div className="text-white ">
    <div className="text-xl font-bold">{title}</div>
    <div className="text-sm">By {author.join(', ')}</div>
  
  </div>
  )
}

export default BookMessage