import { Star } from "lucide-react"

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Anna Kowalska",
      location: "Warszawa",
      rating: 5,
      text: "Świetna obsługa i profesjonalny montaż. Polecam każdemu!",
    },
    {
      name: "Piotr Nowak",
      location: "Kraków",
      rating: 5,
      text: "Rachunki za prąd spadły o 80%. Najlepsza inwestycja!",
    },
    {
      name: "Maria Wiśniewska",
      location: "Gdańsk",
      rating: 5,
      text: "Proces był bardzo prosty, a efekty przeszły moje oczekiwania.",
    },
  ]

  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Co mówią nasi klienci?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Dołącz do tysięcy zadowolonych właścicieli domów
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-card-foreground mb-4 leading-relaxed">"{testimonial.text}"</p>
              <div className="border-t border-border pt-4">
                <div className="font-bold text-card-foreground">{testimonial.name}</div>
                <div className="text-sm text-muted-foreground">{testimonial.location}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
