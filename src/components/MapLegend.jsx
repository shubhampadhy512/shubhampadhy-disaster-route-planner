// src/components/MapLegend.jsx
// Table that explains every symbol on the map. Keep the emojis and colours in sync with MapView.jsx.

const dot = (bg, size = 22, content = null) => (
    <span
        aria-hidden="true"
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size,
            height: size,
            borderRadius: '50%',
            background: bg,
            border: '2px solid #fff',
            boxShadow: '0 0 0 1px rgba(0,0,0,.35)',
            fontSize: 12,
            lineHeight: 1,
        }}
    >
        {content}
    </span>
);

const line = (dashed) => (
    <span
        aria-hidden="true"
        style={{
            display: 'inline-block',
            width: 34,
            borderTop: `4px ${dashed ? 'dashed' : 'solid'} #1f6f8b`,
        }}
    />
);

const ROWS = [
    { group: 'Alerts (click a symbol for details and the alert area)' },
    { sym: dot('#ca8a04', 24, '\u{1F300}'), text: 'Cyclone' },
    { sym: dot('#ca8a04', 24, '\u{1F30A}'), text: 'Storm surge, high waves or flood' },
    { sym: dot('#ca8a04', 24, '\u26A1'), text: 'Lightning or thunderstorm' },
    { sym: dot('#ca8a04', 24, '\u{1F327}\uFE0F'), text: 'Rain' },
    { sym: dot('#ca8a04', 24, '\u{1F4A8}'), text: 'Strong wind' },
    { sym: dot('#ca8a04', 24, '\u26A0\uFE0F'), text: 'Other alert' },
    { sym: dot('#b91c1c', 24), text: 'Red circle: Extreme severity' },
    { sym: dot('#ea580c', 24), text: 'Orange circle: Severe' },
    { sym: dot('#ca8a04', 24), text: 'Yellow circle: Moderate' },
    { sym: dot('#2563eb', 24), text: 'Blue circle: other or unknown severity' },
    { group: 'Shelters and routes' },
    { sym: dot('#2f7d4f', 14), text: 'Green dot: shelter (unverified, may be incomplete)' },
    { sym: dot('#2f7d4f', 22), text: 'Large green dot: the shelter you selected' },
    { sym: line(false), text: 'Solid blue line: road route to the selected shelter' },
    { sym: line(true), text: 'Dashed blue line: direction only, no road route found' },
    { group: 'You' },
    { sym: <span aria-hidden="true">{'\u{1F4CD}'}</span>, text: 'Blue pin: your location (only if you allow access)' },
];

export default function MapLegend() {
    return (
        <div style={{ marginTop: 16, overflowX: 'auto' }}>
            <h3 style={{ margin: '0 0 8px' }}>Map symbols</h3>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.95rem' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', padding: '6px 10px', width: 70 }}>Symbol</th>
                        <th style={{ textAlign: 'left', padding: '6px 10px' }}>What it means</th>
                    </tr>
                </thead>
                <tbody>
                    {ROWS.map((r, i) =>
                        r.group ? (
                            <tr key={i}>
                                <td
                                    colSpan={2}
                                    style={{ padding: '8px 10px', fontWeight: 700, borderTop: '1px solid rgba(128,128,128,.35)' }}
                                >
                                    {r.group}
                                </td>
                            </tr>
                        ) : (
                            <tr key={i}>
                                <td style={{ padding: '4px 10px' }}>{r.sym}</td>
                                <td style={{ padding: '4px 10px' }}>{r.text}</td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
            <p style={{ margin: '8px 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
                Alert symbols are placed at the centre of the first alert area, and some alerts have no
                map shape at all. Read the alert text for the exact area. Routes don&apos;t know about
                floods or blocked roads.
            </p>
        </div>
    );
}