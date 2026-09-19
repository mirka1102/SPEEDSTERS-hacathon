# Program data sources

One line per program in `data/programs.json`: source URL, what was checked there, and the date.
`dataStatus: "demo"` entries are flagged — their numbers are plausible estimates, not confirmed
from the source, until someone re-checks and either verifies or corrects them.

| id | university | source | what was checked | date | status |
|---|---|---|---|---|---|
| mit-eecs | MIT | https://mitadmissions.org | tuition, GPA/IELTS/TOEFL/SAT minimums, application deadline | 2026-09-19 | verified |
| asu-cs | Arizona State University | https://asu.edu | tuition, scholarship terms, IELTS/TOEFL minimums, deadline | 2026-09-19 | verified |
| purdue-business | Purdue University | https://purdue.edu | tuition, GPA/SAT minimums — **not individually confirmed, estimate** | 2026-09-19 | demo |
| imperial-computing | Imperial College London | https://imperial.ac.uk | tuition, GPA/IELTS/TOEFL minimums, deadline | 2026-09-19 | verified |
| manchester-mecheng | University of Manchester | https://manchester.ac.uk | tuition, scholarship terms, IELTS/TOEFL minimums | 2026-09-19 | verified |
| coventry-business | Coventry University | https://coventry.ac.uk | tuition, GPA/IELTS minimums — **not individually confirmed, estimate** | 2026-09-19 | demo |
| tum-informatics | TU Munich | https://tum.de | tuition (free), IELTS/TOEFL minimums, TestAS requirement, deadline | 2026-09-19 | verified |
| rwth-mecheng | RWTH Aachen | https://rwth-aachen.de | tuition (free), German B2 requirement, deadline | 2026-09-19 | verified |
| kaist-cs | KAIST | https://kaist.ac.kr | tuition, scholarship terms, IELTS/TOEFL minimums, deadline | 2026-09-19 | verified |
| koc-engineering | Koç University | https://ku.edu.tr | tuition, scholarship terms, IELTS/TOEFL/SAT minimums, deadline | 2026-09-19 | verified |
| bilkent-cs | Bilkent University | https://bilkent.edu.tr | tuition, scholarship terms, IELTS/TOEFL minimums, deadline | 2026-09-19 | verified |
| sabanci-natsci | Sabancı University | https://sabanciuniv.edu | tuition, GPA/IELTS minimums — **not individually confirmed, estimate** | 2026-09-19 | demo |
| risd-graphic-design | RISD | https://www.risd.edu/admissions/first-year/international-applicants | tuition, IELTS/TOEFL minimums — GPA estimated, not published | 2026-09-19 | demo |
| berkeley-mcb | UC Berkeley | https://financialaid.berkeley.edu/cost-attendance | tuition, GPA/IELTS/TOEFL minimums | 2026-09-19 | demo |
| csm-graphic-communication-design | Central Saint Martins (UAL) | https://www.ucas.com/explore/courses/15b4e97d-c521-299f-b259-c8d3fb93680f/course | tuition, IELTS minimum — GPA estimated, not published (portfolio-based admission) | 2026-09-19 | demo |
| ucl-natural-sciences | UCL | https://www.ucl.ac.uk/prospective-students/undergraduate/degrees/natural-sciences-bsc-2026 | tuition, IELTS/TOEFL minimums, A-level requirement — GPA is a 4.0-scale estimate of A*AA | 2026-09-19 | demo |
| mannheim-business-administration | University of Mannheim | https://www.uni-mannheim.de/en/academics/before-your-studies/programs/business-administration/ | tuition, German-language requirement — GPA estimated, not published | 2026-09-19 | demo |
| lmu-munich-physics | LMU Munich | https://www.physik.lmu.de/en/studies/study-exchange/as-an-international-physics-exchange-student-at-lmu/ | tuition (near-free), German B2 requirement — GPA estimated, not published | 2026-09-19 | demo |
| udk-berlin-visual-communication | UdK Berlin | https://udk-berlin.de/en/application/applicationguide/bachelor-visual-communication | tuition (near-free), portfolio/German requirement — GPA estimated, not published | 2026-09-19 | demo |
| kaist-mecheng | KAIST | https://kaist.ac.kr | reuses KAIST's verified university-wide tuition/scholarship/IELTS/TOEFL policy (same as kaist-cs) for the Mechanical Engineering department | 2026-09-19 | verified |
| yonsei-business-administration | Yonsei University | http://iadmission.yonsei.ac.kr/ | IELTS/TOEFL minimums — tuition and GPA estimated, not published | 2026-09-19 | demo |
| snu-chemistry | Seoul National University | https://en.snu.ac.kr/admission | tuition, IELTS/TOEFL minimums, admission-type eligibility — GPA estimated | 2026-09-19 | demo |
| hongik-visual-communication-design | Hongik University | https://oia.hongik.ac.kr/oia-e | portfolio requirement — tuition, living cost, and GPA all estimated, not published | 2026-09-19 | demo |
| bogazici-business-administration | Boğaziçi University | https://globalstudents.bogazici.edu.tr/en/pages/tuition-fees/3022 | tuition, IELTS/TOEFL/SAT minimums — GPA estimated, not published | 2026-09-19 | demo |
| bilkent-communication-design | Bilkent University | https://w3.bilkent.edu.tr/international/?p=78 | IELTS/TOEFL minimums — tuition and GPA estimated, not published | 2026-09-19 | demo |

<!--
Append one row per new program here as you add it to programs.json. Keep the source URL specific
(the actual admissions/tuition page you checked, not just the homepage) where possible.
-->
