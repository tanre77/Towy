import { Btn, Field, TextInput } from "@/components/towy/bits";
import { carColors, carMark } from "@/lib/towy/model";
import { useTowy } from "@/lib/towy/store";

export function ProfileScreen() {
  const profile = useTowy((s) => s.profiles.find((item) => item.userId === s.activeUserId) ?? null);
  const updateProfile = useTowy((s) => s.updateProfile);
  const setView = useTowy((s) => s.setView);

  if (!profile) {
    return (
      <div className="rise flex flex-1 flex-col pt-8">
        <h1 className="screen-title text-2xl font-medium tracking-tight" data-screen-title tabIndex={-1}>
          Profile
        </h1>
        <p className="mt-2 text-sm text-muted">Sign in and your car is the only one on the map.</p>
      </div>
    );
  }

  const car = profile.vehicle;

  return (
    <div className="rise flex flex-1 flex-col">
      <h1 className="screen-title text-2xl font-medium tracking-tight" data-screen-title tabIndex={-1}>
        {profile.name || "Profile"}
      </h1>
      <p className="mt-2 text-sm text-muted">Only this car is on the map. Other members keep theirs.</p>
      <p className="mt-4 text-sm text-muted">{carMark(car) || "No car yet"}</p>
      <div className="mt-6 space-y-4">
        <Field label="Name">
          <TextInput value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} autoComplete="name" />
        </Field>
        <Field label="Phone for the shop">
          <TextInput value={profile.phone} onChange={(e) => updateProfile({ phone: e.target.value })} inputMode="tel" autoComplete="tel" placeholder="(614) 555-0198" />
        </Field>
        <Field label="Where you are">
          <TextInput value={profile.place} onChange={(e) => updateProfile({ place: e.target.value })} placeholder="Powell" />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Year">
            <TextInput value={car.year} onChange={(e) => updateProfile({ vehicle: { year: e.target.value } })} inputMode="numeric" />
          </Field>
          <Field label="Make">
            <TextInput value={car.make} onChange={(e) => updateProfile({ vehicle: { make: e.target.value } })} />
          </Field>
          <Field label="Model">
            <TextInput value={car.model} onChange={(e) => updateProfile({ vehicle: { model: e.target.value } })} />
          </Field>
        </div>
        <Field label="License plate">
          <TextInput value={car.plate ?? ""} onChange={(e) => updateProfile({ vehicle: { plate: e.target.value.toUpperCase() } })} maxLength={8} autoCapitalize="characters" />
        </Field>
        <div>
          <p className="mb-2 text-sm font-medium text-muted">Color</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
            {carColors.map((swatch) => {
              const on = car.color === swatch.id;
              return (
                <button
                  key={swatch.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => updateProfile({ vehicle: { color: swatch.id } })}
                  className={`press inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm ${on ? "text-fg" : "text-muted"}`}
                >
                  <span className="size-4 rounded-full border border-line" style={{ background: swatch.hex }} />
                  {swatch.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <Btn className="mt-8 w-full" onClick={() => setView("home")}>
        Show this car on the map
      </Btn>
    </div>
  );
}
