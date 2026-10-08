import { useState, useMemo } from 'react'
import type { Node } from '@xyflow/react'
import type {
  WorkflowNodeData,
  CareerComparisonItem,
  StudentProfileNodeData,
  CareerDiscoveryNodeData,
  AIRoadmapNodeData,
  EligibilityCheckerNodeData,
  SkillGapAnalysisNodeData,
  SimulationNodeData,
} from '../types/workflow'

interface CareerComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  nodes: Node<WorkflowNodeData>[]
}

function getEligibilityBadgeStyle(status: string) {
  const norm = status.toUpperCase()
  if (norm.includes('GREEN') || norm === 'DIRECT') {
    return {
      bg: 'rgba(16, 185, 129, 0.15)',
      color: '#34d399',
      border: 'rgba(16, 185, 129, 0.4)',
      label: 'GREEN • Directly Accessible',
    }
  }
  if (norm.includes('YELLOW') || norm === 'ADDITIONAL_REQUIREMENTS') {
    return {
      bg: 'rgba(234, 179, 8, 0.15)',
      color: '#facc15',
      border: 'rgba(234, 179, 8, 0.4)',
      label: 'YELLOW • Additional Upskilling',
    }
  }
  if (norm.includes('RED') || norm === 'RESTRICTED') {
    return {
      bg: 'rgba(239, 68, 68, 0.15)',
      color: '#f87171',
      border: 'rgba(239, 68, 68, 0.4)',
      label: 'RED • Statutory Barrier',
    }
  }
  return {
    bg: 'rgba(148, 163, 184, 0.12)',
    color: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.3)',
    label: status,
  }
}

export function CareerComparisonModal({
  isOpen,
  onClose,
  nodes,
}: CareerComparisonModalProps) {
  // 1. Harvest all available career datasets across current workflow without making new AI calls
  const availableCareers = useMemo<CareerComparisonItem[]>(() => {
    const map = new Map<string, CareerComparisonItem>()

    // A. Check Student Profile primary goal
    const profileNode = nodes.find((n) => n.type === 'studentProfileNode')
    const profileData = (profileNode?.data || {}) as StudentProfileNodeData

    // B. Check Primary AI Roadmap
    const roadmapNode = nodes.find((n) => n.type === 'aiRoadmapNode')
    const roadmapData = (roadmapNode?.data || {}) as AIRoadmapNodeData
    const eligibilityNode = nodes.find((n) => n.type === 'eligibilityCheckerNode')
    const eligibilityData = (eligibilityNode?.data || {}) as EligibilityCheckerNodeData
    const skillGapNode = nodes.find((n) => n.type === 'skillGapAnalysisNode')
    const skillGapData = (skillGapNode?.data || {}) as SkillGapAnalysisNodeData

    const primaryCareer =
      roadmapData.targetCareer ||
      profileData.careerGoal ||
      'Software Engineer'

    if (primaryCareer) {
      const rm = roadmapData.roadmapResult
      const el = eligibilityData.eligibilityResult
      const sg = skillGapData.skillGapResult

      map.set(primaryCareer.toLowerCase(), {
        careerName: primaryCareer,
        source: 'primary',
        qualification:
          el?.qualification_requirements ||
          profileData.educationLevel ||
          'Bachelor’s Degree in Technical Discipline or Equivalent Portfolio',
        eligibility:
          el?.explanation ||
          'Primary targeted track aligned with student preferences and foundational competencies.',
        eligibilityStatus: el?.status || 'GREEN',
        missingSkills: sg?.missing_skills || ['Advanced System Design', 'Production CI/CD'],
        learningTime: rm?.total_estimated_duration || '3 - 6 Months',
        entryRoles: [
          `Associate ${primaryCareer}`,
          `Junior ${primaryCareer}`,
          'Technical Trainee',
        ],
        careerGrowth:
          'Level 1: Associate (0-2y) → Level 2: Mid-Level (2-4y) → Level 3: Senior (4-7y) → Level 4: Lead/Staff (7y+)',
        additionalRequirements:
          el?.additional_requirements || [
            'Verifiable GitHub project portfolio',
            'Data structures problem solving',
          ],
        roadmapLength: rm ? `${rm.steps.length} Milestones` : '4 Phases',
      })
    }

    // C. Check Career Discovery Node
    const discoveryNode = nodes.find((n) => n.type === 'careerDiscoveryNode')
    const discData = (discoveryNode?.data || {}) as CareerDiscoveryNodeData
    if (discData.careers && discData.careers.length > 0) {
      discData.careers.forEach((c) => {
        const key = c.career_name.toLowerCase()
        if (!map.has(key)) {
          map.set(key, {
            careerName: c.career_name,
            source: 'discovery',
            qualification:
              c.qualification_requirements ||
              'Open entry / Bachelor’s or demonstrated subject competence',
            eligibility: c.match_reason,
            eligibilityStatus:
              c.eligibility_level === 'direct'
                ? 'GREEN'
                : c.eligibility_level === 'restricted'
                ? 'RED'
                : 'YELLOW',
            missingSkills: c.missing_skills || [],
            learningTime: '3 - 5 Months (Standard Upskilling)',
            entryRoles:
              c.possible_entry_roles && c.possible_entry_roles.length > 0
                ? c.possible_entry_roles
                : [`Junior ${c.career_name}`, `Associate ${c.career_name}`],
            careerGrowth: 'Entry → Mid → Senior → Principal Leadership',
            additionalRequirements: [
              'Role-specific case study portfolio',
              'Domain practical assessments',
            ],
            roadmapLength: '4 Phases',
          })
        }
      })
    }

    // D. Check What-If Simulation Nodes
    const simNodes = nodes.filter((n) => n.type === 'simulationNode')
    simNodes.forEach((sn) => {
      const sData = (sn.data || {}) as SimulationNodeData
      const sim = sData.simulationData
      if (sim) {
        const key = sim.career.toLowerCase()
        map.set(key, {
          careerName: sim.career,
          source: 'simulation',
          qualification: sim.required_qualification,
          eligibility: sim.eligibility.explanation,
          eligibilityStatus: sim.eligibility.status,
          missingSkills: sim.skill_gap.missing_skills,
          learningTime: `${sim.major_steps.length * 3 - 2} - ${sim.major_steps.length * 4} Weeks`,
          entryRoles: sim.possible_entry_roles,
          careerGrowth:
            'Level 1: Junior Associate → Level 2: Mid-Level Specialist → Level 3: Senior Practitioner → Level 4: Strategic Lead',
          additionalRequirements: sim.eligibility.additional_requirements,
          roadmapLength: `${sim.major_steps.length} Milestones`,
        })
      }
    })

    // E. Pre-populate classic archetypes if list is small so user can always compare
    const defaults = [
      {
        name: 'Data Analyst',
        qual: 'Bachelor’s degree in any quantitative field or verified SQL portfolio',
        elig: 'Accessible with practical SQL, business intelligence, and spreadsheet modeling.',
        status: 'YELLOW',
        missing: ['Advanced SQL (Window Functions)', 'Power BI / Tableau', 'Python Pandas'],
        time: '3 - 4 Months',
        roles: ['Junior Data Analyst', 'BI Analyst', 'Operations Analyst'],
        growth: 'Junior Analyst (0-2y) → Senior Analyst (3-5y) → Analytics Manager / Lead (5y+)',
        reqs: ['BI Dashboard Portfolio', 'SQL Certification / Practical Test'],
        len: '4 Milestones',
      },
      {
        name: 'Product Manager',
        qual: 'Undergraduate degree with product thinking, user empathy, and PRD specifications',
        elig: 'Open entry. Requires cross-functional leadership, customer discovery, and metrics acumen.',
        status: 'YELLOW',
        missing: ['Product Requirements (PRD)', 'Product Analytics (Funnel/A/B)', 'RICE Prioritization'],
        time: '4 - 6 Months',
        roles: ['Associate Product Manager (APM)', 'Product Operations Specialist', 'Product Analyst'],
        growth: 'APM (0-2y) → Product Manager (2-5y) → Senior PM (5-8y) → Group PM / VP Product (8y+)',
        reqs: ['Public Product Teardown', 'PRD Spec Writing Portfolio'],
        len: '4 Milestones',
      },
      {
        name: 'Government career',
        qual: 'Recognized Bachelor’s Degree + Mandatory competitive merit examination',
        elig: 'Statutory examination barrier. Government civil service exams and strict age caps apply.',
        status: 'RED',
        missing: ['General Studies Syllabus', 'Quantitative Aptitude (CSAT)', 'Public Administration'],
        time: '9 - 14 Months',
        roles: ['Assistant Section Officer', 'Probationary Officer', 'Cadre Officer (Group A/B)'],
        growth: 'Grade B / Section Officer → Under Secretary → Deputy Secretary → Director / Joint Secretary',
        reqs: ['Civil Service Prelims & Mains Rank', 'Interview & Background Clearance'],
        len: '4 Phases',
      },
    ]

    defaults.forEach((def) => {
      const k = def.name.toLowerCase()
      if (!map.has(k)) {
        map.set(k, {
          careerName: def.name,
          source: 'custom',
          qualification: def.qual,
          eligibility: def.elig,
          eligibilityStatus: def.status,
          missingSkills: def.missing,
          learningTime: def.time,
          entryRoles: def.roles,
          careerGrowth: def.growth,
          additionalRequirements: def.reqs,
          roadmapLength: def.len,
        })
      }
    })

    return Array.from(map.values())
  }, [nodes])

  // Selected careers for multi-column comparison (default to first 2)
  const [selectedCareerNames, setSelectedCareerNames] = useState<string[]>([])

  // Initialize selection with first 2-3 items on initial render if empty
  const activeSelected = useMemo(() => {
    if (selectedCareerNames.length > 0) {
      return selectedCareerNames
    }
    return availableCareers.slice(0, 2).map((c) => c.careerName)
  }, [selectedCareerNames, availableCareers])

  const toggleCareer = (name: string) => {
    setSelectedCareerNames((prev) => {
      const current = prev.length > 0 ? prev : availableCareers.slice(0, 2).map((c) => c.careerName)
      if (current.includes(name)) {
        if (current.length <= 1) return current // keep at least 1
        return current.filter((n) => n !== name)
      } else {
        if (current.length >= 4) return current // max 4 for responsive table layout
        return [...current, name]
      }
    })
  }

  const comparedItems = useMemo(() => {
    return availableCareers.filter((c) => activeSelected.includes(c.careerName))
  }, [availableCareers, activeSelected])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 17, 32, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '95vw',
          maxWidth: '1240px',
          maxHeight: '90vh',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0b1120',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>⚖️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                Multi-Career Comparison Matrix
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Compare qualifications, eligibility, skill gaps, learning timelines, and entry roles using cached workflow telemetry (Zero redundant AI calls).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              fontSize: '14px',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Selection Bar */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#131b2e',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            Select Careers to Compare (Pick 2 to 4):
          </span>
          {availableCareers.map((c) => {
            const isSelected = activeSelected.includes(c.careerName)
            return (
              <button
                key={c.careerName}
                type="button"
                onClick={() => toggleCareer(c.careerName)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: isSelected ? '1px solid #3b82f6' : '1px solid #334155',
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : '#0b1120',
                  color: isSelected ? '#93c5fd' : '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{isSelected ? '✓' : '+'}</span>
                <span>{c.careerName}</span>
                {c.source === 'primary' && (
                  <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', backgroundColor: '#1e3a8a', color: '#bfdbfe' }}>
                    Primary
                  </span>
                )}
                {c.source === 'simulation' && (
                  <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', backgroundColor: '#581c87', color: '#f3e8ff' }}>
                    What-If
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Comparison Table Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `180px repeat(${comparedItems.length}, minmax(240px, 1fr))`,
              gap: '12px',
              borderCollapse: 'collapse',
            }}
          >
            {/* Header Row: Career Names */}
            <div style={{ padding: '12px', fontWeight: 700, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', alignSelf: 'center' }}>
              Metric / Feature
            </div>
            {comparedItems.map((c) => (
              <div
                key={c.careerName}
                style={{
                  padding: '12px',
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                  {c.careerName}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Track: {c.source === 'primary' ? '⭐ Primary Goal' : c.source === 'simulation' ? '🔮 What-If Route' : '🧭 Discovered'}
                </div>
              </div>
            ))}

            {/* Row 1: Eligibility */}
            <div style={{ padding: '10px 12px', fontWeight: 600, fontSize: '11px', color: '#94a3b8' }}>
              Eligibility Level
            </div>
            {comparedItems.map((c) => {
              const badge = getEligibilityBadgeStyle(c.eligibilityStatus)
              return (
                <div
                  key={c.careerName}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#131b2e',
                    borderRadius: '6px',
                    border: '1px solid #1e293b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    {badge.label}
                  </span>
                  <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.35 }}>
                    {c.eligibility}
                  </p>
                </div>
              )
            })}

            {/* Row 2: Required Qualification */}
            <div style={{ padding: '10px 12px', fontWeight: 600, fontSize: '11px', color: '#94a3b8' }}>
              Required Qualification
            </div>
            {comparedItems.map((c) => (
              <div
                key={c.careerName}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#131b2e',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                  fontSize: '11px',
                  color: '#e2e8f0',
                  lineHeight: 1.4,
                }}
              >
                {c.qualification}
              </div>
            ))}

            {/* Row 3: Missing Skills */}
            <div style={{ padding: '10px 12px', fontWeight: 600, fontSize: '11px', color: '#94a3b8' }}>
              Missing Skill Gaps
            </div>
            {comparedItems.map((c) => (
              <div
                key={c.careerName}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#131b2e',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                }}
              >
                {c.missingSkills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {c.missingSkills.map((sk, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          color: '#fca5a5',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>
                    ✓ No major skill deficits
                  </span>
                )}
              </div>
            ))}

            {/* Row 4: Learning Time */}
            <div style={{ padding: '10px 12px', fontWeight: 600, fontSize: '11px', color: '#94a3b8' }}>
              Estimated Learning Time
            </div>
            {comparedItems.map((c) => (
              <div
                key={c.careerName}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#131b2e',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#38bdf8',
                }}
              >
                ⏱️ {c.learningTime}
              </div>
            ))}

            {/* Row 5: Roadmap Length */}
            <div style={{ padding: '10px 12px', fontWeight: 600, fontSize: '11px', color: '#94a3b8' }}>
              Roadmap Length & Depth
            </div>
            {comparedItems.map((c) => (
              <div
                key={c.careerName}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#131b2e',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                  fontSize: '11px',
                  color: '#e2e8f0',
                }}
              >
                🗺️ {c.roadmapLength}
              </div>
            ))}

            {/* Row 6: Possible Entry Roles */}
            <div style={{ padding: '10px 12px', fontWeight: 600, fontSize: '11px', color: '#94a3b8' }}>
              Immediate Entry Roles
            </div>
            {comparedItems.map((c) => (
              <div
                key={c.careerName}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#131b2e',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                }}
              >
                {c.entryRoles.map((role, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '10px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: '#1e293b',
                      color: '#a7f3d0',
                      border: '1px solid #334155',
                    }}
                  >
                    🎯 {role}
                  </span>
                ))}
              </div>
            ))}

            {/* Row 7: Additional Requirements */}
            <div style={{ padding: '10px 12px', fontWeight: 600, fontSize: '11px', color: '#94a3b8' }}>
              Additional Requirements
            </div>
            {comparedItems.map((c) => (
              <div
                key={c.careerName}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#131b2e',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                }}
              >
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                  {c.additionalRequirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Row 8: Career Growth */}
            <div style={{ padding: '10px 12px', fontWeight: 600, fontSize: '11px', color: '#94a3b8' }}>
              Career Growth Ladder
            </div>
            {comparedItems.map((c) => (
              <div
                key={c.careerName}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#131b2e',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                  fontSize: '11px',
                  color: '#cbd5e1',
                  lineHeight: 1.4,
                }}
              >
                📈 {c.careerGrowth}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

