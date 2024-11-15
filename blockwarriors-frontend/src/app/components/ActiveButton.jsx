function ActiveButton({ onClick, text, className }) {
  return (
    <div className="w-[200px]">
      <button
        onClick={onClick}
        className={`
                    w-full 
                    bg-orange-500 
                    hover:bg-orange-700 
                    text-white 
                    font-bold 
                    py-4 
                    px-8 
                    rounded-2xl
                    text-center
                    text-xl
                    ${className || ''}
                `}
      >
        {text}
      </button>
    </div>
  );
}

export default ActiveButton;
