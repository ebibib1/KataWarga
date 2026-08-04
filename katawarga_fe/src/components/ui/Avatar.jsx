// Avatar — reusable user avatar component
// Supports both image URL (src) and initials fallback
export default function Avatar({
  src = null,
  initials = "?",
  color = "bg-[#192126]",
  size = "w-9 h-9",
  textSize = "text-sm",
}) {
  if (src) {
    return (
      <div className={`${size} rounded-full flex-shrink-0 overflow-hidden border-2 border-white shadow-sm`}>
        <img
          src={src}
          alt={initials}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials on broken image
            e.target.style.display = "none";
            e.target.parentElement.innerHTML = `<span class="${textSize} font-bold text-white leading-none">${initials}</span>`;
            e.target.parentElement.style.background = "#192126";
            e.target.parentElement.style.display = "flex";
            e.target.parentElement.style.alignItems = "center";
            e.target.parentElement.style.justifyContent = "center";
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${size} ${color} rounded-full flex items-center justify-center flex-shrink-0`}
    >
      <span className={`${textSize} font-bold text-white leading-none`}>
        {initials}
      </span>
    </div>
  );
}
