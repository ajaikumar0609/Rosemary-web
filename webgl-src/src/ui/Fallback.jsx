import React from 'react'
import { SCHOOL, NAV } from '../content.js'

// Shown only when WebGL is unavailable
export default function Fallback() {
  return (
    <div className="fallback">
      <div className="fallback-card">
        <img src="images/logo.png" alt="" onError={(e) => (e.target.style.display = 'none')} />
        <p className="fb-overline">Since {SCHOOL.since} · Tirunelveli</p>
        <h1>{SCHOOL.fullName}</h1>
        <p className="fb-body">
          Nurturing confident, principled young people at {SCHOOL.address}.
          Your browser can't show the 3D campus experience — explore the site below.
        </p>
        <div className="fb-links">
          <a className="btn btn-gold" href="admissions.html">Apply for Admission</a>
          <a className="btn btn-glass" href="index-classic.html">Visit Classic Site</a>
        </div>
        <nav>
          {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
        </nav>
        <p className="fb-contact">{SCHOOL.phone} · {SCHOOL.email}</p>
      </div>
    </div>
  )
}
