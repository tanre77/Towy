import SwiftUI

struct JobView: View {
    @EnvironmentObject private var desk: Desk
    @State private var calling = false
    @State private var stars = 0
    @State private var note = ""

    private let steps = ["Truck rolling", "Halfway check-in", "On scene", "Closed"]

    var body: some View {
        if let job = desk.active {
            jobBody(job)
        }
    }

    private func jobBody(_ job: Job) -> some View {
        let company = job.selectedCompanyId.flatMap { TowyMath.company($0) }
        let quote = job.calls.first { $0.companyId == job.selectedCompanyId }?.quote
        let location = TowyMath.place(job.locationId)
        let liveEta = job.live?.etaMin ?? quote?.etaMin ?? 0
        let at = stepIndex(job.status)

        return ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("\(location.road) mile \(location.mile) · \(location.place)")
                    .font(.subheadline)
                    .foregroundStyle(TowyColor.muted)
                Text(company?.name ?? "Shop confirmed")
                    .font(.title2.weight(.medium))
                    .padding(.top, 8)
                Text(calling ? "…" : liveEta == 0 ? "Here" : "\(liveEta)")
                    .font(.system(size: 56, weight: .medium))
                    .monospacedDigit()
                    .padding(.top, 16)
                if !calling && liveEta != 0 {
                    Text("minutes").font(.subheadline).foregroundStyle(TowyColor.muted)
                }
                Text(calling ? "Calling \(company?.name ?? "the shop") for a live update." : (job.live?.note ?? "Truck is rolling."))
                    .font(.subheadline)
                    .foregroundStyle(TowyColor.muted)
                    .padding(.top, 8)
                if let quote {
                    Text("Quote held at \(TowyMath.usd(job.live?.total ?? quote.total))")
                        .font(.subheadline)
                        .foregroundStyle(TowyColor.muted)
                        .monospacedDigit()
                        .padding(.top, 8)
                }
                if job.payment?.method == "apple-pay", let amount = job.payment?.amount {
                    Text("Paid \(TowyMath.usd(amount)) with Apple Pay. Insurance was not charged.")
                        .font(.subheadline)
                        .foregroundStyle(TowyColor.muted)
                        .padding(.top, 8)
                }
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(steps.enumerated()), id: \.offset) { index, label in
                        Text(label)
                            .font(.subheadline)
                            .foregroundStyle(index <= at ? TowyColor.paper : TowyColor.subtle)
                            .padding(.vertical, 8)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .overlay(alignment: .bottom) { Rectangle().fill(TowyColor.line).frame(height: 1) }
                    }
                }
                .padding(.top, 20)
                .overlay(alignment: .top) { Rectangle().fill(TowyColor.line).frame(height: 1) }

                if let quote {
                    SplitList(quote: quote).padding(.top, 20)
                }

                if job.status != .done && job.status != .arrived {
                    PrimaryButton(title: job.status == .checked ? "Call the shop again" : "Halfway check-in call", disabled: calling) {
                        calling = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                            desk.halfway()
                            calling = false
                        }
                    }
                    .padding(.top, 20)
                }
                if job.status == .checked {
                    LineButton(title: "Truck is on scene") { desk.arrive() }
                        .padding(.top, 8)
                }
                if job.status == .arrived {
                    PrimaryButton(title: "Close this stop") { desk.close() }
                        .padding(.top, 20)
                }
                if job.status == .done {
                    Text("How was \(company?.name ?? "the shop")?")
                        .font(.body.weight(.medium))
                        .padding(.top, 28)
                    Text("Stays on the shop that showed up.")
                        .font(.subheadline)
                        .foregroundStyle(TowyColor.muted)
                    HStack(spacing: 4) {
                        ForEach(1...5, id: \.self) { value in
                            Button {
                                stars = value
                            } label: {
                                Image(systemName: value <= stars ? "star.fill" : "star")
                                    .frame(width: 44, height: 44)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("\(value) stars")
                        }
                    }
                    TextField("Note", text: $note, axis: .vertical)
                        .lineLimit(3...6)
                        .foregroundStyle(TowyColor.paper)
                        .padding(.vertical, 12)
                        .overlay(alignment: .bottom) { Rectangle().fill(TowyColor.line).frame(height: 1) }
                    PrimaryButton(title: job.review == nil ? "Save review" : "Update review", disabled: stars < 1) {
                        desk.saveReview(stars: stars, text: note)
                    }
                    .padding(.top, 12)
                    if job.review != nil {
                        Text("Saved on \(company?.name ?? "the shop").")
                            .font(.subheadline)
                            .foregroundStyle(Color(red: 143 / 255, green: 175 / 255, blue: 150 / 255))
                            .padding(.top, 8)
                    }
                }
            }
            .padding(.bottom, 32)
        }
        .onAppear {
            if stars == 0 { stars = job.review?.stars ?? 0 }
            if note.isEmpty { note = job.review?.text ?? "" }
        }
    }

    private func stepIndex(_ status: JobStatus) -> Int {
        switch status {
        case .done: 3
        case .arrived: 2
        case .checked: 1
        default: 0
        }
    }
}
