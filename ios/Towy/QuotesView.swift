import PassKit
import SwiftUI

struct QuotesView: View {
    @EnvironmentObject private var desk: Desk
    @State private var picked: String?
    @State private var paying = false
    @State private var unavailable = false

    var body: some View {
        let job = desk.active
        let quotes = job?.calls.filter { $0.quote != nil } ?? []
        let declines = job?.calls.filter { !$0.available } ?? []
        let selectedId = picked ?? quotes.first?.companyId
        let selected = quotes.first { $0.companyId == selectedId }
        let share = selected?.quote?.driverPays ?? 0
        let covered = selected?.quote?.covered ?? 0

        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Estimates").font(.title2.weight(.medium))
                if let job {
                    Text("\(TowyMath.equipmentLabel(job.situation.equipment))\(job.situation.winch ? ", winch" : ""). Nearest shop that can take it.")
                        .font(.subheadline)
                        .foregroundStyle(TowyColor.muted)
                        .padding(.top, 8)
                }
                ForEach(declines) { call in
                    Text("\(TowyMath.company(call.companyId)?.name ?? "Shop") declined. \(call.decline ?? "")")
                        .font(.subheadline)
                        .foregroundStyle(TowyColor.muted)
                        .padding(.top, 8)
                }
                ForEach(quotes) { call in
                    if let quote = call.quote, let company = TowyMath.company(call.companyId) {
                        let score = TowyMath.score(company, desk.reviews)
                        let on = selectedId == company.id
                        Button {
                            picked = company.id
                        } label: {
                            VStack(alignment: .leading, spacing: 6) {
                                HStack(alignment: .firstTextBaseline) {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(company.name).foregroundStyle(TowyColor.paper)
                                        Text(String(format: "%.1f · %.1f mi", score.rating, quote.miles))
                                            .font(.subheadline)
                                            .foregroundStyle(TowyColor.muted)
                                            .monospacedDigit()
                                    }
                                    Spacer()
                                    VStack(alignment: .trailing, spacing: 4) {
                                        Text(TowyMath.usd(quote.total)).monospacedDigit()
                                        Text("\(quote.etaMin) min").font(.subheadline).foregroundStyle(TowyColor.muted).monospacedDigit()
                                    }
                                }
                                if on {
                                    Text(quote.note).font(.subheadline).foregroundStyle(TowyColor.muted)
                                }
                            }
                            .padding(.vertical, 16)
                            .overlay(alignment: .top) { Rectangle().fill(TowyColor.line).frame(height: 1) }
                        }
                        .buttonStyle(.plain)
                    }
                }
                if let quote = selected?.quote {
                    SplitList(quote: quote).padding(.top, 8)
                    if share == 0 {
                        Text("Insurance covers the service. Nothing to charge.")
                            .font(.subheadline)
                            .foregroundStyle(TowyColor.muted)
                            .padding(.top, 20)
                        PrimaryButton(title: "Confirm this shop") {
                            if let id = selected?.companyId { desk.confirm(companyId: id, payment: nil) }
                        }
                        .padding(.top, 12)
                    } else {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Your share of the service")
                                .font(.subheadline)
                                .foregroundStyle(TowyColor.muted)
                            Text(TowyMath.usd(share))
                                .font(.title2.weight(.medium))
                                .monospacedDigit()
                            Text(covered > 0
                                 ? "Insurance covers \(TowyMath.usd(covered)) and is not charged here."
                                 : "No insurance on this stop, so the whole tow is yours.")
                                .font(.subheadline)
                                .foregroundStyle(TowyColor.muted)
                            PayWithApplePayButton(.plain) {
                                guard let id = selected?.companyId, !paying else { return }
                                paying = true
                                ApplePay.present(amount: share) { ok in
                                    DispatchQueue.main.async {
                                        paying = false
                                        if ok {
                                            desk.confirm(companyId: id, payment: Payment(method: "apple-pay", amount: share))
                                        } else {
                                            unavailable = true
                                        }
                                    }
                                }
                            }
                            .payWithApplePayButtonStyle(.white)
                            .frame(height: 48)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .disabled(paying)
                            .opacity(paying ? 0.4 : 1)
                            .padding(.top, 8)
                        }
                        .padding(16)
                        .background(TowyColor.surface, in: RoundedRectangle(cornerRadius: 24))
                        .padding(.top, 16)
                    }
                } else if job != nil {
                    Text("No shop could take this stop. Change the equipment or the mile marker.")
                        .font(.subheadline)
                        .foregroundStyle(TowyColor.muted)
                        .padding(.top, 16)
                }
            }
            .padding(.bottom, 32)
        }
        .alert("Apple Pay isn't available", isPresented: $unavailable) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Add a card in Wallet. The app id also needs the merchant \(ApplePay.merchantID).")
        }
    }
}
