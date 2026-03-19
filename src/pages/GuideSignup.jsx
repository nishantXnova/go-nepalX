import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export default function GuideSignup() {
    const [form, setForm] = useState({
        full_name: "",
        phone: "",
        email: "",
        regions: [],
        languages: [],
        experience_years: "",
        price_per_day: "",
        license_number: "",
        bio: "",
    })
    const [licenseFile, setLicenseFile] = useState(null)
    const [citizenshipFile, setCitizenshipFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleCheckbox = (field, value) => {
        const current = form[field]
        if (current.includes(value)) {
            setForm({ ...form, [field]: current.filter(x => x !== value) })
        } else {
            setForm({ ...form, [field]: [...current, value] })
        }
    }

    const handleSubmit = async () => {
        if (!form.full_name || !form.phone || !form.email) {
            alert("Please fill all required fields")
            return
        }
        if (!licenseFile || !citizenshipFile) {
            alert("Please upload both documents")
            return
        }
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const uploadFile = async (file, name) => {
                // Block files larger than 5MB
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error("File too large. Maximum size is 5MB.")
                }
                // Block non-image/pdf files
                if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
                    throw new Error("Only JPG, PNG or PDF files allowed.")
                }
                const { data, error } = await supabase.storage
                    .from("kyc-documents")
                    .upload(`guides/${name}_${Date.now()}`, file)
                if (error) throw error
                return data.path
            }

            const licenseUrl = await uploadFile(licenseFile, "license")
            const citizenshipUrl = await uploadFile(citizenshipFile, "citizenship")

            const { error } = await supabase.from("guide_applications").insert({
                ...form,
                experience_years: parseInt(form.experience_years),
                price_per_day: parseInt(form.price_per_day),
                license_photo_url: licenseUrl,
                citizenship_photo_url: citizenshipUrl,
                user_id: user?.id ?? null,
            })

            if (error) throw error
            setSubmitted(true)
        } catch (err) {
            alert("Error: " + err.message)
        }
        setLoading(false)
    }

    if (submitted) return (
        <div className="text-center p-20">
            <h2 className="text-3xl font-bold text-green-600">Application Submitted!</h2>
            <p className="mt-4 text-gray-500">We will review your application within 2-3 days.</p>
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-2">Become a GoNepal Guide</h1>
            <p className="text-gray-500 mb-8">Fill in your details. We review every application manually.</p>

            <div className="space-y-4 mb-8">
                <input name="full_name" placeholder="Full Name *" onChange={handleChange} className="w-full border p-3 rounded-lg" />
                <input name="phone" placeholder="Phone Number *" onChange={handleChange} className="w-full border p-3 rounded-lg" />
                <input name="email" type="email" placeholder="Email *" onChange={handleChange} className="w-full border p-3 rounded-lg" />
                <input name="license_number" placeholder="Trekking License Number" onChange={handleChange} className="w-full border p-3 rounded-lg" />
                <input name="experience_years" type="number" placeholder="Years of Experience" onChange={handleChange} className="w-full border p-3 rounded-lg" />
                <input name="price_per_day" type="number" placeholder="Price per Day (USD)" onChange={handleChange} className="w-full border p-3 rounded-lg" />
                <textarea name="bio" placeholder="Tell tourists about yourself..." onChange={handleChange} className="w-full border p-3 rounded-lg h-32" />
            </div>

            <div className="mb-8">
                <p className="font-semibold mb-3">Regions you guide:</p>
                <div className="flex flex-wrap gap-3">
                    {["Annapurna", "Everest", "Langtang", "Pokhara", "Kathmandu"].map(r => (
                        <label key={r} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" onChange={() => handleCheckbox("regions", r)} />
                            {r}
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-8">
                <p className="font-semibold mb-3">Languages you speak:</p>
                <div className="flex flex-wrap gap-3">
                    {["English", "French", "German", "Japanese", "Chinese", "Hindi"].map(l => (
                        <label key={l} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" onChange={() => handleCheckbox("languages", l)} />
                            {l}
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-8 space-y-4">
                <div>
                    <p className="font-semibold mb-2">Upload Trekking License *</p>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setLicenseFile(e.target.files[0])} className="w-full border p-3 rounded-lg" />
                </div>
                <div>
                    <p className="font-semibold mb-2">Upload Citizenship Card *</p>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setCitizenshipFile(e.target.files[0])} className="w-full border p-3 rounded-lg" />
                </div>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="w-full bg-orange-500 text-white p-4 rounded-lg font-bold text-lg">
                {loading ? "Submitting..." : "Submit Application"}
            </button>
        </div>
    )
}
