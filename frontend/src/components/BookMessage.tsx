

interface Props{
    title: string
    author: string[]
    genres: string[]
    onDislike: ()=> void
    onLike: () => void
}

const BookMessage = ({title, author,genres, onDislike, onLike}:Props) => {
  const cleanGenres = genres?.map((genre) => {
    if (typeof genre !== "string") return "";
    return genre.trim();
  }).filter(genre => genre !== "");
  return (
    <div className="text-white w-fit">
      <div className="md:text-xl text-lg font-bold">{title}</div>
      <div className="md:text-sm text-xs">By {author}</div>
      <div className="flex justify-between items-center pt-3 mt-auto space-x-2">
        <div className="flex flex-wrap md:gap-2 gap-1">
        {cleanGenres?.map((genre, index) => (
  <span
    key={index}
    className="md:px-3 px-2 py-1 md:text-xs text-[13px] rounded-full bg-[#6b4c9c] text-white"
  >
    {genre}
  </span>
))}
        </div>
        <div className="flex-shrink-0">
          <span className="cursor-pointer" onClick={onLike}>
            👍
          </span>
          <span className="cursor-pointer" onClick={onDislike}>
            👎
          </span>
        </div>
      </div>
    </div>
  )
}

export default BookMessage