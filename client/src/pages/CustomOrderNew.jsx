import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Upload, X, Info, Ruler } from "lucide-react";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import SizeChartModal from "../components/product/SizeChartModal";
import { useCreateCustomOrderMutation } from "../store/api/customOrderApi";

// Top / jacket measurements — what we already collected.
const TOP_FIELDS = [
  { key: "chest", label: "Chest (in)" },
  { key: "shoulder", label: "Shoulder (in)" },
  { key: "sleeve", label: "Sleeve length (in)" },
  { key: "length", label: "Garment length (in)" },
  { key: "neck", label: "Neck (in)" },
  { key: "waist", label: "Waist (in)" },
];

// Trouser / bottom measurements — fully optional.
const BOTTOM_FIELDS = [
  { key: "trouserWaist", label: "Waist (in)" },
  { key: "hips", label: "Hip (in)" },
  { key: "thigh", label: "Thigh (in)" },
  { key: "inseam", label: "Inseam (in)" },
  { key: "outseam", label: "Outseam (in)" },
  { key: "legOpening", label: "Leg opening (in)" },
];

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB per image

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function CustomOrderNew() {
  const navigate = useNavigate();
  const [createCustomOrder, { isLoading }] = useCreateCustomOrderMutation();

  const [designImages, setDesignImages] = useState([]);
  const [clothPhotos, setClothPhotos] = useState([]);
  const [sizeDetails, setSizeDetails] = useState({});
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [userNotes, setUserNotes] = useState("");
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [includeBottom, setIncludeBottom] = useState(false);

  const handleUpload = async (e, target) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const urls = await Promise.all(
        files.map((f) => {
          if (f.size > MAX_FILE_BYTES) {
            throw new Error(`${f.name} exceeds 4 MB`);
          }
          return fileToDataUrl(f);
        }),
      );
      if (target === "design") setDesignImages((prev) => [...prev, ...urls]);
      else setClothPhotos((prev) => [...prev, ...urls]);
    } catch (err) {
      toast.error(err.message || "Failed to read file");
    } finally {
      e.target.value = "";
    }
  };

  const removeImg = (target, idx) => {
    if (target === "design")
      setDesignImages((prev) => prev.filter((_, i) => i !== idx));
    else setClothPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    if (designImages.length === 0)
      return toast.error("Upload at least one design image");
    const filledSize = Object.values(sizeDetails).some(
      (v) => String(v || "").trim() !== "",
    );
    if (!filledSize)
      return toast.error("Please fill at least one size measurement");

    try {
      const res = await createCustomOrder({
        designImages,
        clothPhotos,
        sizeDetails,
        description,
        quantity: Number(quantity) || 1,
        userNotes,
      }).unwrap();
      toast.success(
        "Custom design submitted — admin will review and quote a price",
      );
      navigate(`/custom-orders/${res.customOrder.id}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to submit");
    }
  };

  return (
    <div className="section py-8 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-serif mb-2">
        Custom Design Order
      </h1>
      <p className="text-sm text-brand-muted mb-6">
        Upload your design, share fabric photos and measurements. Our team will
        review and send you a price quote.
      </p>

      <div className="card p-4 sm:p-6 mb-5 bg-brand-light/50 border border-brand-secondary/20">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-brand-secondary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">How it works</p>
            <ol className="list-decimal list-inside space-y-1 text-brand-muted">
              <li>Submit your design + measurements.</li>
              <li>Admin sends you a price quote.</li>
              <li>
                You can accept the quote, or make a <strong>one-time</strong>{" "}
                counter offer.
              </li>
              <li>
                Once approved, place the order and pay like any regular order.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Designs */}
      <div className="card p-4 sm:p-6 mb-5">
        <h2 className="font-serif text-lg mb-3">
          Design images <span className="text-red-500">*</span>
        </h2>
        <div className="flex flex-wrap gap-3 mb-3">
          {designImages.map((src, i) => (
            <div key={i} className="relative">
              <img
                src={src}
                alt=""
                className="w-24 h-24 object-cover rounded border"
              />
              <button
                onClick={() => removeImg("design", i)}
                className="absolute -top-2 -right-2 bg-white rounded-full border shadow p-1"
                type="button"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <label className="w-24 h-24 border-2 border-dashed rounded flex flex-col items-center justify-center text-xs text-brand-muted cursor-pointer hover:border-brand-primary">
            <Upload size={18} />
            <span className="mt-1">Add</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e, "design")}
            />
          </label>
        </div>
        <p className="text-xs text-brand-muted">Max 4 MB per image.</p>
      </div>

      {/* Cloth photos */}
      <div className="card p-4 sm:p-6 mb-5">
        <h2 className="font-serif text-lg mb-3">
          Fabric / cloth photos{" "}
          <span className="text-brand-muted text-sm">(optional)</span>
        </h2>
        <div className="flex flex-wrap gap-3">
          {clothPhotos.map((src, i) => (
            <div key={i} className="relative">
              <img
                src={src}
                alt=""
                className="w-24 h-24 object-cover rounded border"
              />
              <button
                onClick={() => removeImg("cloth", i)}
                className="absolute -top-2 -right-2 bg-white rounded-full border shadow p-1"
                type="button"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <label className="w-24 h-24 border-2 border-dashed rounded flex flex-col items-center justify-center text-xs text-brand-muted cursor-pointer hover:border-brand-primary">
            <Upload size={18} />
            <span className="mt-1">Add</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e, "cloth")}
            />
          </label>
        </div>
      </div>

      {/* Size */}
      <div className="card p-4 sm:p-6 mb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="font-serif text-lg">
              Size details <span className="text-red-500">*</span>
            </h2>
            <p className="text-xs text-brand-muted mt-1">
              Enter measurements in inches. Not sure of your size? Use the size chart.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSizeChartOpen(true)}
            className="text-xs flex items-center gap-1 text-brand-secondary hover:underline shrink-0"
          >
            <Ruler size={14} /> Size chart
          </button>
        </div>

        <h3 className="text-sm font-medium mt-2 mb-2 text-brand-primary">
          Top / Jacket measurements
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOP_FIELDS.map((f) => (
            <Input
              key={f.key}
              label={f.label}
              type="number"
              value={sizeDetails[f.key] || ""}
              onChange={(e) =>
                setSizeDetails({ ...sizeDetails, [f.key]: e.target.value })
              }
            />
          ))}
        </div>

        <div className="border-t mt-5 pt-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeBottom}
              onChange={(e) => setIncludeBottom(e.target.checked)}
            />
            <span className="font-medium text-brand-primary">
              Add trouser / bottom measurements
            </span>
            <span className="text-xs text-brand-muted">(optional)</span>
          </label>
          {includeBottom && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {BOTTOM_FIELDS.map((f) => (
                <Input
                  key={f.key}
                  label={f.label}
                  type="number"
                  value={sizeDetails[f.key] || ""}
                  onChange={(e) =>
                    setSizeDetails({ ...sizeDetails, [f.key]: e.target.value })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Other */}
      <div className="card p-4 sm:p-6 mb-5">
        <h2 className="font-serif text-lg mb-3">Description & quantity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Input
            label="Quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <label className="label">Design description</label>
        <textarea
          className="input min-h-[90px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the design, fabric, color, occasion, deadline, etc."
        />
        <label className="label mt-3">Notes for admin (optional)</label>
        <textarea
          className="input min-h-[70px]"
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => navigate("/custom-orders")}>
          Cancel
        </Button>
        <Button onClick={submit} loading={isLoading}>
          Submit Design
        </Button>
      </div>

      <SizeChartModal
        open={sizeChartOpen}
        onClose={() => setSizeChartOpen(false)}
        productFits={[]}
      />
    </div>
  );
}
