

interface Props{
    title: string
    author: string[]
    genres: string[]
    onDislike: ()=> void
    onLike: () => void
}

const BookMessage = ({title, author,genres, onDislike, onLike}:Props) => {
  const cleanGenres = genres?.map((genre) => {
    if (typeof genre !== "string") return ""; // Ili neki drugi fallback
    return genre.trim();
  }).filter(genre => genre !== "");
  return (
    <div className="text-white w-fit">
      <div className="text-xl font-bold">{title}</div>
      <div className="text-sm">By {author}</div>
      <div className="flex justify-between items-center pt-3 mt-auto space-x-2">
        <div className="flex flex-wrap gap-2 flex-shrink-0">
        {cleanGenres?.map((genre, index) => (
  <span
    key={index}
    className="px-3 py-1 text-xs rounded-full bg-[#6b4c9c] text-white"
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