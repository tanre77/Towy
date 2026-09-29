import SwiftUI

struct CallingView: View {
    @EnvironmentObject private var desk: Desk
    @State private var index = 0
    @State private var phase = "dial"

    private var calls: [CallResult] { desk.active?.calls ?? [] }

    var body: some View {
        let current = index < calls.count ? calls[index] : nil
        let company = current.flatMap { TowyMath.company($0.companyId) }
        let lines = (desk.active != nil && current != nil && company != nil)
            ? TowyMath.callLines(company!, desk.active!, current!)
            : []

        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                if index >= calls.count && !calls.isEmpty {
                    Text("Estimates are in.")
                        .font(.title2.weight(.medium))
                } else if let company {
                    Text(phase == "dial" ? "Calling \(company.name)" : company.name)
                        .font(.title2.weight(.medium))
                    Text(company.phone)
                        .font(.subheadline)
                        .foregroundStyle(TowyColor.muted)
                    if phase == "talk" {
                        ForEach(Array(lines.enumerated()), id: \.offset) { _, line in
                            Text(line)
                                .font(.subheadline)
                                .foregroundStyle(TowyColor.muted)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.bottom, 32)
        }
        .task(id: "\(index)-\(phase)") {
            guard index < calls.count else {
                try? await Task.sleep(nanoseconds: 400_000_000)
                desk.finishCalling()
                return
            }
            try? await Task.sleep(nanoseconds: phase == "dial" ? 900_000_000 : 1_700_000_000)
            if phase == "dial" {
                phase = "talk"
            } else {
                index += 1
                phase = "dial"
            }
        }
    }
}
