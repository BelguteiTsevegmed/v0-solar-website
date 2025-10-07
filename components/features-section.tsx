import { Zap, Shield, TrendingDown, Leaf } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: "Oszczędzaj na rachunkach",
      description: "Zmniejsz swoje rachunki za prąd nawet o 90% dzięki energii słonecznej",
    },
    {
      icon: Shield,
      title: "Gwarancja spokoju",
      description: "Kompleksowa gwarancja na panele i instalację do 25 lat",
    },
    {
      icon: TrendingDown,
      title: "Atrakcyjne finansowanie",
      description: "Leasing przez 3 miesiące gratis i elastyczne opcje płatności",
    },
    {
      icon: Leaf,
      title: "Ekologiczne rozwiązanie",
      description: "Zmniejsz swój ślad węglowy i zadbaj o środowisko",
    },
  ]

  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Dlaczego warto wybrać Otovo?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Jesteśmy liderem w branży fotowoltaiki w Polsce
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
