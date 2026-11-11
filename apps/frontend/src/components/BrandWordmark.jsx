export default function BrandWordmark({ className = "" }) {
  return (
    <span className={`inline-flex items-baseline font-extrabold tracking-tight ${className}`}>
      <span className="text-white">flow</span>
      <span className="text-[#ff6500]">CTRL</span>
    </span>
  );
}
