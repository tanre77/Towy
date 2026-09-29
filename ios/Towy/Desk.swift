import Foundation

final class Desk: ObservableObject {
    @Published var screen: Screen = .home
    @Published var step = 0
    @Published var activeId: String?
    @Published var jobs: [Job] = []
    @Published var reviews: [Review] = []
    @Published var yardId = "scioto"

    private let key = "towy-ios-v1"

    init() {
        if !load() {
            jobs = Self.seeds()
        }
    }

    var active: Job? {
        jobs.first { $0.id == activeId }
    }

    func setScreen(_ screen: Screen) {
        self.screen = screen
        persist()
    }

    func back() {
        if screen == .intake && step > 0 {
            step -= 1
            persist()
            return
        }
        if screen != .home {
            screen = screen == .quotes ? .intake : .home
            if screen == .intake { step = 3 }
            persist()
        }
    }

    func startJob(source: String = "member", locked: Coverage? = nil) {
        var job = TowyMath.blank(source: source)
        if let locked {
            job.coverage = locked
            job.coverageLocked = true
            job.contactName = "Harbor member"
        }
        jobs.removeAll { $0.id == job.id }
        jobs.append(job)
        activeId = job.id
        step = 0
        screen = .intake
        persist()
    }

    func setStep(_ step: Int) {
        self.step = step
        persist()
    }

    func useSample(ev: Bool) {
        mutate { job in
            job = TowyMath.applySample(job, ev: ev)
        }
    }

    func patchContact(name: String? = nil, phone: String? = nil) {
        mutate { job in
            if let name { job.contactName = name }
            if let phone { job.contactPhone = phone }
        }
    }

    func patchVehicle(_ body: (inout Vehicle) -> Void) {
        mutate { job in
            body(&job.vehicle)
            job = TowyMath.recompute(job)
        }
    }

    func setPreset(_ vehicle: Vehicle) {
        mutate { job in
            job.vehicle = vehicle
            job.situation.equipmentTouched = false
            job = TowyMath.recompute(job)
        }
    }

    func setStarts(_ value: Bool) { mutate { $0.situation.starts = value; $0 = TowyMath.recompute($0) } }
    func setRolls(_ value: Bool) { mutate { $0.situation.rolls = value; $0 = TowyMath.recompute($0) } }
    func setPosition(_ value: Position) { mutate { $0.situation.position = value; $0 = TowyMath.recompute($0) } }
    func setSide(_ value: Side) { mutate { $0.situation.side = value; $0 = TowyMath.recompute($0) } }
    func setEquipment(_ value: Equipment) { mutate { $0.situation.equipment = value; $0.situation.equipmentTouched = true } }
    func setWinch(_ value: Bool) { mutate { $0.situation.winch = value; $0.situation.winchTouched = true } }
    func setPolice(_ value: Bool) { mutate { $0.situation.police = value; $0.situation.policeTouched = true } }
    func setLocation(_ id: String) { mutate { $0.locationId = id; $0 = TowyMath.recompute($0) } }
    func setCoverage(_ coverage: Coverage) {
        mutate { job in
            if !job.coverageLocked { job.coverage = coverage }
        }
    }

    func useRecommendations() {
        mutate { job in
            job.situation.equipmentTouched = false
            job.situation.winchTouched = false
            job.situation.policeTouched = false
            job = TowyMath.recompute(job)
        }
    }

    func placeCalls() {
        guard var job = active else { return }
        job = TowyMath.recompute(job)
        job.calls = TowyMath.buildCalls(job)
        job.status = .calling
        job.selectedCompanyId = nil
        job.live = nil
        job.review = nil
        replace(job)
        screen = .calling
        persist()
    }

    func finishCalling() {
        mutate { job in
            if job.status == .calling { job.status = .quoted }
        }
        screen = .quotes
        persist()
    }

    func confirm(companyId: String, payment: Payment?) {
        mutate { job in
            guard job.calls.contains(where: { $0.companyId == companyId && $0.quote != nil }),
                  let quote = job.calls.first(where: { $0.companyId == companyId })?.quote else { return }
            job.selectedCompanyId = companyId
            job.status = .enroute
            job.payment = payment
            job.live = LiveUpdate(etaMin: quote.etaMin, total: quote.total, note: "Yard accepted. Truck is rolling.")
        }
        screen = .job
        persist()
    }

    func halfway() {
        mutate { job in
            if job.status != .done && job.status != .arrived { job.status = .checked }
            job.live = TowyMath.halfway(job)
        }
    }

    func arrive(id: String? = nil) {
        let target = id ?? activeId
        guard let target, let index = jobs.firstIndex(where: { $0.id == target }) else { return }
        let quote = jobs[index].calls.first { $0.companyId == jobs[index].selectedCompanyId }?.quote
        jobs[index].status = .arrived
        jobs[index].live = LiveUpdate(etaMin: 0, total: jobs[index].live?.total ?? quote?.total ?? 0, note: "Truck is on scene.")
        persist()
    }

    func close(id: String? = nil) {
        let target = id ?? activeId
        guard let target, let index = jobs.firstIndex(where: { $0.id == target }) else { return }
        jobs[index].status = .done
        if target == activeId { screen = .job }
        persist()
    }

    func saveReview(stars: Int, text: String) {
        guard var job = active, let companyId = job.selectedCompanyId else { return }
        let review = Review(id: "rev-\(job.id)", companyId: companyId, author: job.contactName.isEmpty ? "Member" : job.contactName, stars: stars, text: text.trimmingCharacters(in: .whitespacesAndNewlines))
        reviews.removeAll { $0.id == review.id }
        reviews.append(review)
        job.review = ReviewNote(stars: stars, text: review.text)
        replace(job)
        persist()
    }

    func setYard(_ id: String) {
        yardId = id
        persist()
    }

    func acceptForYard(jobId: String) {
        guard let index = jobs.firstIndex(where: { $0.id == jobId }),
              let quote = jobs[index].calls.first(where: { $0.companyId == yardId })?.quote else { return }
        jobs[index].selectedCompanyId = yardId
        jobs[index].status = .enroute
        jobs[index].live = LiveUpdate(etaMin: quote.etaMin, total: quote.total, note: "Accepted from the yard board.")
        persist()
    }

    func reset() {
        UserDefaults.standard.removeObject(forKey: key)
        screen = .home
        step = 0
        activeId = nil
        jobs = Self.seeds()
        reviews = []
        yardId = "scioto"
    }

    private func mutate(_ body: (inout Job) -> Void) {
        guard let id = activeId, let index = jobs.firstIndex(where: { $0.id == id }) else { return }
        var next = jobs
        body(&next[index])
        jobs = next
        persist()
    }

    private func replace(_ job: Job) {
        if let index = jobs.firstIndex(where: { $0.id == job.id }) {
            jobs[index] = job
        }
    }

    private struct Snapshot: Codable {
        var screen: Screen
        var step: Int
        var activeId: String?
        var jobs: [Job]
        var reviews: [Review]
        var yardId: String
    }

    private func persist() {
        let snap = Snapshot(screen: screen, step: step, activeId: activeId, jobs: jobs, reviews: reviews, yardId: yardId)
        if let data = try? JSONEncoder().encode(snap) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    private func load() -> Bool {
        guard let data = UserDefaults.standard.data(forKey: key),
              let snap = try? JSONDecoder().decode(Snapshot.self, from: data) else { return false }
        screen = snap.screen
        step = snap.step
        activeId = snap.activeId
        jobs = snap.jobs
        reviews = snap.reviews
        yardId = snap.yardId
        let existing = Set(jobs.map(\.id))
        for seed in Self.seeds() where !existing.contains(seed.id) {
            jobs.insert(seed, at: 0)
        }
        return true
    }

    private static func seeds() -> [Job] {
        func seed(id: String, name: String, vehicle: Vehicle, situation: Situation, location: String, coverage: Coverage, status: JobStatus, company: String?) -> Job {
            var job = TowyMath.blank(source: "seed")
            job.id = id
            job.contactName = name
            job.contactPhone = "(614) 555-0133"
            job.vehicle = vehicle
            job.situation = situation
            job.locationId = location
            job.coverage = coverage
            job.status = status
            job.selectedCompanyId = company
            job = TowyMath.recompute(job)
            job.calls = TowyMath.buildCalls(job)
            if let company, let quote = job.calls.first(where: { $0.companyId == company })?.quote {
                job.live = LiveUpdate(etaMin: quote.etaMin, total: quote.total, note: "Yard accepted. Truck is rolling.")
            }
            return job
        }
        let camry = Situation(starts: false, rolls: true, position: .shoulder, side: .right, equipment: .wheelLift, winch: false, police: false, equipmentTouched: true, winchTouched: true, policeTouched: true)
        let truck = Situation(starts: false, rolls: false, position: .ditch, side: .right, equipment: .flatbed, winch: true, police: true, equipmentTouched: true, winchTouched: true, policeTouched: true)
        return [
            seed(id: "seed-camry", name: "Riley Brooks", vehicle: TowyMath.presets[1].1, situation: camry, location: "i71-111", coverage: .roadside, status: .enroute, company: "scioto"),
            seed(id: "seed-f150", name: "Morgan Ellis", vehicle: TowyMath.presets[2].1, situation: truck, location: "i270-22", coverage: .deductible, status: .quoted, company: nil),
        ]
    }
}
