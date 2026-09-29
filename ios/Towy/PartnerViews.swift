import SwiftUI

struct InsurerView: View {
    @EnvironmentObject private var desk: Desk

    private var example: Quote? {
        var job = TowyMath.applySample(TowyMath.blank(source: "insurer"), ev: false)
        job.coverage = .roadside
        return TowyMath.buildCalls(job).compactMap(\.quote).first
    }

    private let plans = [
        ("Insurer plugin", "$420/mo", "Per brand app."),
        ("Shop board", "$69/mo", "Per company."),
        ("Coordination", "6%", "Only on what the member still owes."),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Harbor Mutual").font(.title2.weight(.medium))
                Text("Alex Chen · roadside · first \(TowyMath.usd(125))")
                    .font(.subheadline)
                    .foregroundStyle(TowyColor.muted)
                    .padding(.top, 8)
                Text("Plugin")
                    .font(.subheadline)
                    .foregroundStyle(TowyColor.muted)
                    .padding(.top, 24)
                PrimaryButton(title: "Open dispatch") {
                    desk.startJob(source: "insurer", locked: .roadside)
                }
                .padding(.top, 16)
                ForEach(plans, id: \.0) { plan in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(plan.0)
                            Spacer()
                            Text(plan.1).monospacedDigit()
                        }
                        Text(plan.2).font(.subheadline).foregroundStyle(TowyColor.muted)
                    }
                    .padding(.vertical, 16)
                    .overlay(alignment: .top) { Rectangle().fill(TowyColor.line).frame(height: 1) }
                }
                if let example {
                    Text("Worked stop · Civic, I-70, roadside cap")
                        .font(.subheadline)
                        .foregroundStyle(TowyColor.muted)
                        .padding(.top, 8)
                    SplitList(quote: example).padding(.top, 12)
                }
            }
            .padding(.bottom, 32)
        }
    }
}

struct OperatorView: View {
    @EnvironmentObject private var desk: Desk

    private var visible: [Job] {
        desk.jobs.filter { job in
            job.status != .draft && job.status != .calling && job.calls.contains { $0.companyId == desk.yardId }
        }
    }

    var body: some View {
        let yard = TowyMath.company(desk.yardId)
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text(yard?.name ?? "Shop").font(.title2.weight(.medium))
                Text(yard?.yard ?? "").font(.subheadline).foregroundStyle(TowyColor.muted).padding(.top, 4)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 16) {
                        ForEach(TowyMath.companies) { company in
                            Button(company.name) { desk.setYard(company.id) }
                                .font(.subheadline)
                                .foregroundStyle(company.id == desk.yardId ? TowyColor.paper : TowyColor.muted)
                                .buttonStyle(.plain)
                        }
                    }
                }
                .padding(.top, 16)
                if visible.isEmpty {
                    Text("Nothing on this shop yet. Run a member stop, or switch shops.")
                        .font(.subheadline)
                        .foregroundStyle(TowyColor.muted)
                        .padding(.top, 24)
                }
                ForEach(visible) { job in
                    card(job)
                }
            }
            .padding(.bottom, 32)
        }
    }

    private func card(_ job: Job) -> some View {
        let location = TowyMath.place(job.locationId)
        let quote = job.calls.first { $0.companyId == desk.yardId }?.quote
        let takenBy = job.selectedCompanyId.flatMap { id in id == desk.yardId ? nil : TowyMath.company(id) }
        let mine = job.selectedCompanyId == desk.yardId
        let open = job.selectedCompanyId == nil && job.status == .quoted
        return VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(job.contactName.isEmpty ? "Member" : job.contactName).fontWeight(.medium)
                    Text("\(job.vehicle.year) \(job.vehicle.make) \(job.vehicle.model)")
                        .font(.subheadline)
                        .foregroundStyle(TowyColor.muted)
                }
                Spacer()
                Text(statusLabel(job.status)).font(.subheadline).foregroundStyle(TowyColor.muted)
            }
            Text("\(location.road) \(location.mile)")
                .font(.title2.weight(.medium))
                .monospacedDigit()
            Text("\(location.direction) · \(TowyMath.positionLabel(job.situation.position)) · \(TowyMath.equipmentLabel(job.situation.equipment))\(job.situation.winch ? " · winch" : "")\(job.situation.police ? " · officer" : "")")
                .font(.subheadline)
                .foregroundStyle(TowyColor.muted)
            if job.payment?.method == "apple-pay", let amount = job.payment?.amount {
                Text("Member paid \(TowyMath.usd(amount)) with Apple Pay.")
                    .font(.subheadline)
                    .foregroundStyle(TowyColor.muted)
            }
            if let takenBy {
                Text("Taken by \(takenBy.name).").font(.subheadline).foregroundStyle(TowyColor.muted)
            } else if let quote {
                Text("\(quote.etaMin) min · \(TowyMath.usd(quote.total)) quote · shop keeps \(TowyMath.usd(quote.operatorReceives))")
                    .font(.subheadline)
                    .monospacedDigit()
            } else {
                Text("This shop declined the stop.").font(.subheadline).foregroundStyle(TowyColor.muted)
            }
            if open, quote != nil {
                PrimaryButton(title: "Accept and roll") {
                    desk.activeId = job.id
                    desk.acceptForYard(jobId: job.id)
                }
            }
            if mine && (job.status == .enroute || job.status == .checked) {
                PrimaryButton(title: "Halfway check-in") {
                    desk.activeId = job.id
                    desk.halfway()
                }
            }
            if mine && job.status == .checked {
                LineButton(title: "On scene") { desk.arrive(id: job.id) }
            }
            if mine && job.status == .arrived {
                PrimaryButton(title: "Close") { desk.close(id: job.id) }
            }
        }
        .padding(.vertical, 16)
        .overlay(alignment: .top) { Rectangle().fill(TowyColor.line).frame(height: 1) }
        .padding(.top, 8)
    }

    private func statusLabel(_ status: JobStatus) -> String {
        switch status {
        case .draft: "Intake"
        case .calling: "Calling"
        case .quoted: "Waiting on a shop"
        case .enroute: "Rolling"
        case .checked: "Checked in"
        case .arrived: "On scene"
        case .done: "Closed"
        }
    }
}
