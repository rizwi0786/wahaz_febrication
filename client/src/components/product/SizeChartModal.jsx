import { useState } from 'react';
import Modal from '../common/Modal';

const FITS = [
  {
    key: 'slim',
    label: 'Slim Fit',
    intro:
      'Sharp, contoured cut. Higher armholes, tapered waist, narrower lapels and a slightly shorter length for a modern silhouette. Tip: pairs well with fabrics that have 1–2% elastane.',
    jacket: {
      cols: ['Size', 'Chest (in)', 'Chest (cm)', 'Waist (in)', 'Waist (cm)', 'Shoulder (in)', 'Shoulder (cm)'],
      rows: [
        ['S', '36"', '91 cm', '32"', '81 cm', '17.0"', '43 cm'],
        ['M', '38"', '96 cm', '34"', '86 cm', '17.5"', '44 cm'],
        ['L', '40"', '101 cm', '36"', '91 cm', '18.0"', '46 cm'],
        ['XL', '42"', '106 cm', '38"', '96 cm', '18.5"', '47 cm'],
        ['XXL', '44"', '111 cm', '40"', '101 cm', '19.0"', '48 cm'],
      ],
    },
    trouser: {
      cols: ['Size', 'Waist (in)', 'Waist (cm)', 'Thigh (in)', 'Thigh (cm)', 'Leg Opening (in)', 'Leg Opening (cm)'],
      rows: [
        ['30', '30"', '76 cm', '22"', '56 cm', '13.5"', '34 cm'],
        ['32', '32"', '81 cm', '23"', '58 cm', '14.0"', '35 cm'],
        ['34', '34"', '86 cm', '24"', '61 cm', '14.5"', '37 cm'],
        ['36', '36"', '91 cm', '25"', '63 cm', '15.0"', '38 cm'],
      ],
    },
  },
  {
    key: 'tailored',
    label: 'Tailored Fit',
    intro:
      'The middle ground — shaped through the waist for a clean silhouette but with more room at the chest and shoulders than slim. Comfortable enough for full-day wear.',
    jacket: {
      cols: ['Size', 'Chest (in)', 'Chest (cm)', 'Waist (in)', 'Waist (cm)', 'Shoulder (in)', 'Shoulder (cm)'],
      rows: [
        ['S', '37"', '94 cm', '34"', '86 cm', '17.5"', '44.5 cm'],
        ['M', '39"', '99 cm', '36"', '91 cm', '18.0"', '46 cm'],
        ['L', '41"', '104 cm', '38"', '96 cm', '18.5"', '47 cm'],
        ['XL', '43"', '109 cm', '40"', '101 cm', '19.0"', '48.5 cm'],
        ['XXL', '45"', '114 cm', '42"', '106 cm', '19.5"', '50 cm'],
      ],
    },
    trouser: {
      cols: ['Size', 'Waist (in)', 'Waist (cm)', 'Thigh (in)', 'Thigh (cm)', 'Leg Opening (in)', 'Leg Opening (cm)'],
      rows: [
        ['30', '30"', '76 cm', '23.5"', '60 cm', '15.0"', '38 cm'],
        ['32', '32"', '81 cm', '24.5"', '62 cm', '15.5"', '39.5 cm'],
        ['34', '34"', '86 cm', '25.5"', '65 cm', '16.0"', '40.5 cm'],
        ['36', '36"', '91 cm', '26.5"', '67 cm', '16.5"', '42 cm'],
      ],
    },
  },
  {
    key: 'regular',
    label: 'Regular Fit',
    intro:
      'Traditional cut with a straight silhouette and very little tapering at the waist. Standard armholes and fuller sleeves — ideal for athletic or broader builds.',
    jacket: {
      cols: ['Size', 'Chest (in)', 'Chest (cm)', 'Waist (in)', 'Waist (cm)', 'Shoulder (in)', 'Shoulder (cm)'],
      rows: [
        ['S', '38"', '96.5 cm', '36"', '91.5 cm', '18.0"', '46 cm'],
        ['M', '40"', '101.5 cm', '38"', '96.5 cm', '18.5"', '47 cm'],
        ['L', '42"', '106.5 cm', '40"', '101.5 cm', '19.0"', '48.5 cm'],
        ['XL', '44"', '111.5 cm', '42"', '106.5 cm', '19.5"', '49.5 cm'],
        ['XXL', '46"', '116.5 cm', '44"', '111.5 cm', '20.0"', '51 cm'],
      ],
    },
    trouser: {
      cols: ['Size', 'Waist (in)', 'Waist (cm)', 'Thigh (in)', 'Thigh (cm)', 'Leg Opening (in)', 'Leg Opening (cm)'],
      rows: [
        ['30', '30"', '76 cm', '25"', '63.5 cm', '16.5"', '42 cm'],
        ['32', '32"', '81 cm', '26"', '66 cm', '17.0"', '43 cm'],
        ['34', '34"', '86 cm', '27"', '68.5 cm', '17.5"', '44.5 cm'],
        ['36', '36"', '91.5 cm', '28"', '71 cm', '18.0"', '46 cm'],
      ],
    },
  },
  {
    key: 'classic',
    label: 'Classic / Relaxed Fit',
    intro:
      'The most generous and forgiving cut. Boxy silhouette with no tapering, fullest room through the chest, waist and arms; high-rise, wide-cut trousers through seat and thigh.',
    jacket: {
      cols: ['Size', 'Chest (in)', 'Chest (cm)', 'Waist (in)', 'Waist (cm)', 'Shoulder (in)', 'Shoulder (cm)'],
      rows: [
        ['S', '40"', '101.5 cm', '39"', '99 cm', '18.5"', '47 cm'],
        ['M', '42"', '106.5 cm', '41"', '104 cm', '19.0"', '48.5 cm'],
        ['L', '44"', '111.5 cm', '43"', '109 cm', '19.5"', '49.5 cm'],
        ['XL', '46"', '116.5 cm', '45"', '114 cm', '20.5"', '52 cm'],
        ['XXL', '48"', '122 cm', '47"', '119 cm', '21.0"', '53.5 cm'],
      ],
    },
    trouser: {
      cols: ['Size', 'Waist (in)', 'Waist (cm)', 'Thigh (in)', 'Thigh (cm)', 'Leg Opening (in)', 'Leg Opening (cm)'],
      rows: [
        ['30', '30"', '76 cm', '26"', '66 cm', '18.0"', '46 cm'],
        ['32', '32"', '81 cm', '27"', '68.5 cm', '18.5"', '47 cm'],
        ['34', '34"', '86 cm', '28"', '71 cm', '19.0"', '48.5 cm'],
        ['36', '36"', '91.5 cm', '29"', '73.5 cm', '19.5"', '49.5 cm'],
      ],
    },
  },
];

const BASE_JACKET = {
  cols: ['Size', 'Numeric', 'Chest (in)', 'Chest (cm)', 'Shoulder (in)', 'Shoulder (cm)'],
  rows: [
    ['XS', '34', '34"', '86 cm', '17.0"', '43 cm'],
    ['S', '36', '36"', '91 cm', '17.5"', '44.5 cm'],
    ['M', '38', '38"', '96 cm', '18.0"', '46 cm'],
    ['L', '40', '40"', '101 cm', '18.5"', '47 cm'],
    ['XL', '42', '42"', '106 cm', '19.0"', '48 cm'],
    ['XXL', '44', '44"', '111 cm', '19.5"', '49.5 cm'],
  ],
};

const BASE_TROUSER = {
  cols: ['Size', 'Waist (in)', 'Waist (cm)', 'Hip (in)', 'Hip (cm)'],
  rows: [
    ['28', '28"', '71 cm', '34"', '86 cm'],
    ['30', '30"', '76 cm', '36"', '91 cm'],
    ['32', '32"', '81 cm', '38"', '96 cm'],
    ['34', '34"', '86 cm', '40"', '101 cm'],
    ['36', '36"', '91 cm', '42"', '106 cm'],
    ['38', '38"', '96 cm', '44"', '111 cm'],
  ],
};

function fitMatchesKey(fit, key) {
  const f = (fit || '').toLowerCase();
  if (key === 'classic') return f.includes('classic') || f.includes('relaxed');
  return f.includes(key);
}

function ChartTable({ chart }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 text-xs text-brand-muted">
            {chart.cols.map((c) => (
              <th key={c} className="text-left px-3 py-2 border">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.rows.map((row, i) => (
            <tr key={i} className="even:bg-gray-50/50">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 border">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SizeChartModal({ open, onClose, productFits = [] }) {
  const initialFit =
    FITS.find((f) =>
      productFits.some((pf) => fitMatchesKey(pf, f.key))
    )?.key || 'slim';
  const [activeFit, setActiveFit] = useState(initialFit);
  const fit = FITS.find((f) => f.key === activeFit) || FITS[0];

  return (
    <Modal open={open} onClose={onClose} title="Size Chart" size="xl">
      <div className="space-y-6">
        <p className="text-xs text-brand-muted">
          Find your size by comparing your body measurements (or those of a garment you already own) against the charts below.
          Switch tabs to see the cut for each fit.
        </p>

        <div className="flex flex-wrap gap-2 border-b">
          {FITS.map((f) => {
            const highlight = productFits.some((pf) => fitMatchesKey(pf, f.key));
            return (
              <button
                key={f.key}
                onClick={() => setActiveFit(f.key)}
                className={`px-3 py-2 text-sm border-b-2 transition ${
                  activeFit === f.key
                    ? 'border-brand-secondary text-brand-primary font-medium'
                    : 'border-transparent text-brand-muted hover:text-brand-primary'
                }`}
              >
                {f.label}
                {highlight && (
                  <span className="ml-1 text-[10px] uppercase tracking-wide text-brand-secondary">
                    • this product
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-brand-muted">{fit.intro}</p>

        <div>
          <h4 className="font-serif text-base mb-2">Jacket / Top — {fit.label}</h4>
          <ChartTable chart={fit.jacket} />
        </div>

        <div>
          <h4 className="font-serif text-base mb-2">Trouser / Bottom — {fit.label}</h4>
          <ChartTable chart={fit.trouser} />
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-brand-primary">
            Standard reference chart (body measurements)
          </summary>
          <div className="space-y-4 mt-3">
            <div>
              <h5 className="text-sm font-medium mb-2">Jacket / Top — body chest</h5>
              <ChartTable chart={BASE_JACKET} />
            </div>
            <div>
              <h5 className="text-sm font-medium mb-2">Trouser / Bottom — body waist</h5>
              <ChartTable chart={BASE_TROUSER} />
            </div>
          </div>
        </details>

        <div className="text-xs text-brand-muted bg-gray-50 border rounded p-3 space-y-1">
          <p className="font-medium text-brand-primary">Fit ease guide (extra fabric over body measurement):</p>
          <p>• Slim Fit — ~5–8 cm</p>
          <p>• Tailored Fit — ~10–12 cm</p>
          <p>• Regular Fit — ~14–16 cm</p>
          <p>• Classic / Relaxed Fit — 18+ cm</p>
        </div>
      </div>
    </Modal>
  );
}
