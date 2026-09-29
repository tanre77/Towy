import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var desk: Desk

    private var here: Place { TowyMath.places[0] }
    private var resume: Job? {
        guard let job = desk.active, job.status != .draft else { return nil }
        return job
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("\(here.road) \(here.direction.lowercased())")
                                .font(.subheadline)
                                .foregroundStyle(TowyColor.muted)
                            Text(here.mile)
                                .font(.system(size: 48, weight: .medium))
                                .monospacedDigit()
                            Text(here.place)
                                .font(.subheadline)
                                .foregroundStyle(TowyColor.muted)
                        }
                        Spacer()
                        Text(TowyMath.trafficLabel(here.traffic))
                            .font(.subheadline)
                            .foregroundStyle(TowyColor.muted)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(TowyColor.asphalt, in: RoundedRectangle(cornerRadius: 8))
                    }
                    PrimaryButton(title: "I need a tow") {
                        desk.startJob()
                    }
                    .padding(.top, 20)
                }
                .padding(16)
                .background(TowyColor.surface, in: RoundedRectangle(cornerRadius: 24))

                if let resume {
                    Button {
                        desk.setScreen(resume.status == .quoted || resume.status == .calling ? .quotes : .job)
                    } label: {
                        HStack(alignment: .firstTextBaseline) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Open stop").font(.subheadline).foregroundStyle(TowyColor.muted)
                                Text(resumeLine(resume)).foregroundStyle(TowyColor.paper)
                            }
                            Spacer()
                            if let eta = resume.calls.first(where: { $0.companyId == resume.selectedCompanyId })?.quote?.etaMin {
                                Text("\(eta) min").foregroundStyle(TowyColor.muted).monospacedDigit()
                            }
                        }
                        .padding(.vertical, 16)
                    }
                    .buttonStyle(.plain)
                    .overlay(alignment: .bottom) { Rectangle().fill(TowyColor.line).frame(height: 1) }
                    .padding(.top, 24)
                }

                VStack(spacing: 0) {
                    link("Insurer plugin", "$420/mo") { desk.setScreen(.insurer) }
                    link("Shop board", "5 shops") { desk.setScreen(.partner) }
                }
                .padding(.top, resume == nil ? 24 : 0)

                VStack(spacing: 0) {
                    ForEach(TowyMath.places) { place in
                        HStack {
                            Text(place.road).font(.subheadline)
                            Spacer()
                            Text(place.mile).font(.title3.weight(.medium)).monospacedDigit()
                            Spacer()
                            Text(TowyMath.trafficLabel(place.traffic))
                                .font(.subheadline)
                                .foregroundStyle(TowyColor.muted)
                        }
                        .padding(.vertical, 12)
                        .overlay(alignment: .top) { Rectangle().fill(TowyColor.line).frame(height: 1) }
                    }
                }
                .padding(.top, 28)

                Button("Reset") { desk.reset() }
                    .font(.subheadline)
                    .foregroundStyle(TowyColor.subtle)
                    .buttonStyle(.plain)
                    .padding(.top, 28)
            }
            .padding(.bottom, 32)
        }
    }

    private func resumeLine(_ job: Job) -> String {
        var line = "\(job.vehicle.year) \(job.vehicle.make) \(job.vehicle.model)"
        if let id = job.selectedCompanyId, let yard = TowyMath.company(id) {
            line += " · \(yard.name)"
        }
        return line
    }

    private func link(_ title: String, _ trailing: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Text(title)
                Spacer()
                Text(trailing).font(.subheadline).foregroundStyle(TowyColor.muted)
            }
            .padding(.vertical, 16)
            .overlay(alignment: .bottom) { Rectangle().fill(TowyColor.line).frame(height: 1) }
        }
        .buttonStyle(.plain)
    }
}
