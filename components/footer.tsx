import Image from "next/image"

export function Footer() {
  return (
    <footer className="w-full py-2 mt-4 text-xs text-gray-500">
      <div className="container flex items-center justify-center space-x-1">
        <span>Powered by</span>
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/zksync-JXgHCaITqj9lLHIRCGFw3LGhN3uF9i.png"
          alt="zkSync Logo"
          width={60}
          height={18}
          className="dark:invert"
        />
      </div>
    </footer>
  )
}

