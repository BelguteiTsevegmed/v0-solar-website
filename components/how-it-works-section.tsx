import { MapPin, Calculator, Wrench, Sun } from "lucide-react"

export function HowItWorksSection() {
  const steps = [
    {
      icon: MapPin,
      number: "01",
      title: "Podaj adres",
      description: "Wpisz swój adres i otrzymaj wstępną wycenę w 10 minut",
    },
    {
      icon: Calculator,
      number: "02",
      title: "Otrzymaj ofertę",
      description: "Nasi eksperci przygotują spersonalizowaną ofertę dla Twojego domu",
    },
    {
      icon: Wrench,
      number: "03",
      title: "Instalacja",
      description: "Profesjonalny montaż przez certyfikowanych instalatorów",
    },
    {
      icon: Sun,
      number: "04",
      title: "Ciesz się energią",
      description: "Zacznij oszczędzać i produkować własną czystą energię",
    },
  ]

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Jak to działa?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">Prosty proces w 4 krokach</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-primary/20" />
              )}

              <div className="relative bg-muted rounded-xl p-6 hover:bg-primary/5 transition-colors">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 relative z-10">
                  <step.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="text-primary font-bold text-sm mb-2">{step.number}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
