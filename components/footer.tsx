import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="text-2xl font-bold mb-4">
              OTOVO<span className="text-primary">☀</span>
            </div>
            <p className="text-background/60 text-sm leading-relaxed">
              Lider w branży fotowoltaiki w Polsce. Pomagamy tysiącom rodzin oszczędzać na rachunkach za prąd.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4">Rozwiązania</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-background/60 hover:text-background transition-colors">
                  Panele fotowoltaiczne
                </Link>
              </li>
              <li>
                <Link href="#" className="text-background/60 hover:text-background transition-colors">
                  Magazyny energii
                </Link>
              </li>
              <li>
                <Link href="#" className="text-background/60 hover:text-background transition-colors">
                  Pompy ciepła
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold mb-4">Firma</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-background/60 hover:text-background transition-colors">
                  O nas
                </Link>
              </li>
              <li>
                <Link href="#" className="text-background/60 hover:text-background transition-colors">
                  Kariera
                </Link>
              </li>
              <li>
                <Link href="#" className="text-background/60 hover:text-background transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-4">Kontakt</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-background/60">
                Tel: <span className="text-background font-bold">22 307 35 68</span>
              </li>
              <li className="text-background/60">Email: kontakt@otovo.pl</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/60 text-sm">© 2025 Otovo. Wszelkie prawa zastrzeżone.</p>
          <div className="flex gap-6 text-sm">
            <Link href="#" className="text-background/60 hover:text-background transition-colors">
              Polityka prywatności
            </Link>
            <Link href="#" className="text-background/60 hover:text-background transition-colors">
              Regulamin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
