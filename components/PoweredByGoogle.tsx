import Image from "next/image";

export function PoweredByGoogle() {
  return (
    <p className="pt-2">
      <Image
        src="/powered-by-google.png"
        alt="Powered by Google"
        width={59}
        height={18}
      />
    </p>
  );
}
