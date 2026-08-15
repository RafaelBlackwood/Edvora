"""Build A.T. Still University's official program and requirements snapshot.

The official ATSU application directory is the discovery source. The curated
records below provide a reviewed fallback so a temporary source outage never
replaces a complete snapshot with an empty file.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser


APPLICATION_DIRECTORY_URL = "https://www.atsu.edu/apply-to-atsu"
GENERAL_ADMISSIONS_URL = "https://www.atsu.edu/student-affairs/admissions"
INTERNATIONAL_ADMISSIONS_URL = (
    "https://www.atsu.edu/student-affairs/admissions/international-students"
)
TUITION_URL = "https://www.atsu.edu/tuition-and-fees"
INSTITUTION_ID = "https://ror.org/05hr6q169"
INSTITUTION_NAME = "A.T. Still University"
OUTPUT_PATH = (
    Path(__file__).resolve().parents[1]
    / "public"
    / "data"
    / "program-catalog"
    / "05hr6q169.json"
)
ROBOTS_URL = "https://www.atsu.edu/robots.txt"
USER_AGENT = "EdvoraProgramSync"


@dataclass(frozen=True)
class ProgramSeed:
    name: str
    level: str
    subject: str
    school: str
    delivery_mode: str
    degree: str
    official_url: str


ASHS = "Arizona School of Health Sciences (ATSU-ASHS)"
ASDOH = "Arizona School of Dentistry & Oral Health (ATSU-ASDOH)"
CGHS = "College of Graduate Health Studies (ATSU-CGHS)"
CHC = "College for Healthy Communities (ATSU-CHC)"
KCOM = "Kirksville College of Osteopathic Medicine (ATSU-KCOM)"
MOSDOH = "Missouri School of Dentistry & Oral Health (ATSU-MOSDOH)"
SOMA = "School of Osteopathic Medicine in Arizona (ATSU-SOMA)"

ATHLETIC_CERTIFICATES_URL = (
    "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
    "athletic-training-graduate-certificates"
)
HEALTH_SCIENCES_CERTIFICATES_URL = (
    "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
    "health-sciences-certificates"
)
KINESIOLOGY_CERTIFICATES_URL = (
    "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
    "kinesiology-certificates"
)
PA_CERTIFICATES_URL = (
    "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
    "pa-graduate-certificates"
)


def seed(
    name: str,
    level: str,
    subject: str,
    school: str,
    mode: str,
    degree: str,
    url: str,
) -> ProgramSeed:
    return ProgramSeed(name, level, subject, school, mode, degree, url)


KNOWN_PROGRAMS = (
    seed(
        "Doctor of Athletic Training",
        "Doctorate",
        "Athletic Training",
        ASHS,
        "Online",
        "DAT",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "doctor-of-athletic-training",
    ),
    seed(
        "Master of Athletic Training, Entry-Level",
        "Master",
        "Athletic Training",
        ASHS,
        "Hybrid",
        "MAT",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "master-of-athletic-training",
    ),
    seed(
        "Master of Science in Athletic Training, Post-Professional",
        "Master",
        "Athletic Training",
        ASHS,
        "Online",
        "MSAT",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "master-of-science-in-athletic-training-online",
    ),
    *(
        seed(name, "Certificate", "Athletic Training", ASHS, "Online", "Certificate", ATHLETIC_CERTIFICATES_URL)
        for name in (
            "Certificate in Athletic Training Education",
            "Certificate in Clinical Decision-Making in Athletic Training",
            "Certificate in Orthopaedics",
            "Certificate in Rehabilitation",
            "Certificate in Sport Neurology and Concussion",
        )
    ),
    seed(
        "Doctor of Audiology, Entry-Level",
        "Doctorate",
        "Audiology",
        ASHS,
        "Residential",
        "AuD",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "entry-level-doctor-of-audiology-degree",
    ),
    seed(
        "Doctor of Audiology, Post-Professional",
        "Doctorate",
        "Audiology",
        ASHS,
        "Online",
        "AuD",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "post-professional-doctor-of-audiology",
    ),
    seed(
        "Doctor of Audiology, Post-Professional (Non-degree)",
        "Non-degree",
        "Audiology",
        ASHS,
        "Online",
        "Non-degree",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "post-professional-doctor-of-audiology-non-degree",
    ),
    seed(
        "Master of Science in Biomedical Sciences (ASHS)",
        "Master",
        "Biomedical Sciences",
        ASHS,
        "Online",
        "MSBMS",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "master-of-science-in-biomedical-sciences",
    ),
    seed(
        "Master of Science in Biomedical Sciences (KCOM)",
        "Master",
        "Biomedical Sciences",
        KCOM,
        "Residential",
        "MS",
        "https://www.atsu.edu/kirksville-college-of-osteopathic-medicine/"
        "academics/master-of-science-in-biomedical-sciences",
    ),
    seed(
        "Doctor of Dental Medicine (ASDOH)",
        "Doctorate",
        "Dentistry",
        ASDOH,
        "Residential",
        "DMD",
        "https://www.atsu.edu/arizona-school-of-dentistry-and-oral-health/"
        "academics/doctor-of-dental-medicine-dmd-program",
    ),
    seed(
        "Master of Science and Certificate in Orthodontics",
        "Master",
        "Orthodontics",
        ASDOH,
        "Residential",
        "MS",
        "https://www.atsu.edu/arizona-school-of-dentistry-and-oral-health/"
        "academics/master-of-science-in-orthodontics",
    ),
    seed(
        "Doctor of Dental Medicine (MOSDOH)",
        "Doctorate",
        "Dentistry",
        MOSDOH,
        "Residential",
        "DMD",
        "https://www.atsu.edu/missouri-school-of-dentistry-and-oral-health/"
        "academics/doctor-of-dental-medicine-program",
    ),
    seed(
        "Advanced Standing International Dentist Track",
        "Professional",
        "Dentistry",
        MOSDOH,
        "Residential",
        "DMD track",
        "https://www.atsu.edu/missouri-school-of-dentistry-and-oral-health/"
        "academics/advanced-standing-dentist-track",
    ),
    seed(
        "Doctor of Health Administration",
        "Doctorate",
        "Health Administration",
        CGHS,
        "Online",
        "DHA",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "doctor-of-health-administration-degree-online",
    ),
    seed(
        "Master of Health Administration",
        "Master",
        "Health Administration",
        CGHS,
        "Online",
        "MHA",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "master-of-health-administration-degree-online",
    ),
    seed(
        "Certificate in Health Administration for Community Health Center Leaders",
        "Certificate",
        "Health Administration",
        CGHS,
        "Online",
        "Certificate",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "certificate-in-health-administration-for-community-health-center-leaders",
    ),
    seed(
        "Doctor of Education in Health Professions Education",
        "Doctorate",
        "Health Professions Education",
        CGHS,
        "Online",
        "EdD",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "doctor-of-education-in-health-professions-degree",
    ),
    seed(
        "Master of Education in Health Professions Education",
        "Master",
        "Health Professions Education",
        CGHS,
        "Online",
        "MEd",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "master-of-education-in-health-professions",
    ),
    seed(
        "Certificate in Health Professions Education",
        "Certificate",
        "Health Professions Education",
        CGHS,
        "Online",
        "Certificate",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "certificate-in-health-professions-education",
    ),
    seed(
        "Certificate in Interprofessional Education",
        "Certificate",
        "Health Professions Education",
        CGHS,
        "Online",
        "Certificate",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "certificate-in-interprofessional-education",
    ),
    seed(
        "Certificate in Teaching with Simulation",
        "Certificate",
        "Health Professions Education",
        CGHS,
        "Online",
        "Certificate",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "certificate-in-teaching-with-simulation",
    ),
    seed(
        "Doctor of Health Sciences",
        "Doctorate",
        "Health Sciences",
        CGHS,
        "Online",
        "DHSc",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "doctor-of-health-sciences-degree-online",
    ),
    seed(
        "Master of Health Sciences",
        "Master",
        "Health Sciences",
        CGHS,
        "Online",
        "MHSc",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "master-of-health-sciences-degree",
    ),
    *(
        seed(name, "Certificate", "Health Sciences", CGHS, "Online", "Certificate", HEALTH_SCIENCES_CERTIFICATES_URL)
        for name in (
            "Certificate in Fundamentals of Education",
            "Certificate in Global Health",
            "Certificate in Leadership and Organizational Behavior",
        )
    ),
    seed(
        "Doctor of Nursing Practice",
        "Doctorate",
        "Nursing",
        CGHS,
        "Online",
        "DNP",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "doctor-of-nursing-practice-online",
    ),
    seed(
        "Certificate in Nurse Education",
        "Certificate",
        "Nursing",
        CGHS,
        "Online",
        "Certificate",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "certificate-in-nursing-education",
    ),
    seed(
        "Doctor of Occupational Therapy, Entry-Level",
        "Doctorate",
        "Occupational Therapy",
        ASHS,
        "Residential",
        "OTD",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "occupational-therapy-doctorate-entry-level-degree",
    ),
    seed(
        "Master of Science in Occupational Therapy",
        "Master",
        "Occupational Therapy",
        ASHS,
        "Residential",
        "MSOT",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "occupational-therapy-masters-degree",
    ),
    seed(
        "Doctor of Osteopathic Medicine (KCOM)",
        "Doctorate",
        "Osteopathic Medicine",
        KCOM,
        "Residential",
        "DO",
        "https://www.atsu.edu/kirksville-college-of-osteopathic-medicine/"
        "academics/doctor-of-osteopathic-medicine-program",
    ),
    seed(
        "Doctor of Osteopathic Medicine (SOMA)",
        "Doctorate",
        "Osteopathic Medicine",
        SOMA,
        "Residential",
        "DO",
        "https://www.atsu.edu/school-of-osteopathic-medicine-arizona/"
        "academics/doctor-of-osteopathic-medicine",
    ),
    seed(
        "Doctor of Physical Therapy, Entry-Level",
        "Doctorate",
        "Physical Therapy",
        ASHS,
        "Residential",
        "DPT",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "doctor-of-physical-therapy",
    ),
    seed(
        "Doctor of Physical Therapy, Postprofessional",
        "Doctorate",
        "Physical Therapy",
        ASHS,
        "Online",
        "DPT",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "post-professional-doctor-of-physical-therapy",
    ),
    seed(
        "Doctor of Physical Therapy, Postprofessional (Non-degree)",
        "Non-degree",
        "Physical Therapy",
        ASHS,
        "Online",
        "Non-degree",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "post-professional-doctor-of-physical-therapy-non-degree",
    ),
    seed(
        "Neurologic Physical Therapy Residency",
        "Residency",
        "Physical Therapy",
        ASHS,
        "Residential",
        "Residency",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "neurologic-physical-therapy-residency",
    ),
    seed(
        "Orthopedic Physical Therapy Residency",
        "Residency",
        "Physical Therapy",
        ASHS,
        "Residential",
        "Residency",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "orthopedic-physical-therapy-residency",
    ),
    seed(
        "Doctor of Medical Science",
        "Doctorate",
        "Physician Assistant Studies",
        ASHS,
        "Online",
        "DMSc",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "doctor-of-medical-science",
    ),
    seed(
        "Master of Science in Physician Assistant Studies (ASHS)",
        "Master",
        "Physician Assistant Studies",
        ASHS,
        "Residential",
        "MSPAS",
        "https://www.atsu.edu/physician-assistant-degree",
    ),
    seed(
        "Master of Science in Physician Assistant Studies (CHC)",
        "Master",
        "Physician Assistant Studies",
        CHC,
        "Residential",
        "MSPAS",
        "https://www.atsu.edu/college-for-healthy-communities/academics/"
        "master-of-science-in-physician-assistant-studies",
    ),
    seed(
        "Certificate in Education for Physician Assistants",
        "Certificate",
        "Physician Assistant Studies",
        ASHS,
        "Online",
        "Certificate",
        PA_CERTIFICATES_URL,
    ),
    seed(
        "Certificate in Leadership for Physician Assistants",
        "Certificate",
        "Physician Assistant Studies",
        ASHS,
        "Online",
        "Certificate",
        PA_CERTIFICATES_URL,
    ),
    seed(
        "Master of Public Health",
        "Master",
        "Public Health",
        CGHS,
        "Online",
        "MPH",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "master-of-public-health-degree-online",
    ),
    seed(
        "Master of Public Health - Dental Emphasis",
        "Master",
        "Public Health",
        CGHS,
        "Online",
        "MPH",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "master-of-public-health-dental-emphasis-degree",
    ),
    seed(
        "Master of Public Health - Dental Emphasis with a Dental Public Health Residency Certificate",
        "Master",
        "Public Health",
        CGHS,
        "Online",
        "MPH",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "dental-emphasis-dental-public-health-residency",
    ),
    seed(
        "Certificate in Public Health Advocacy and Leadership",
        "Certificate",
        "Public Health",
        CGHS,
        "Online",
        "Certificate",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "certificate-in-public-health-advocacy-and-leadership",
    ),
    seed(
        "Certificate in Public Health, Emergency Preparedness and Disaster Response",
        "Certificate",
        "Public Health",
        CGHS,
        "Online",
        "Certificate",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "certificate-in-public-health-emergency",
    ),
    seed(
        "Certificate in Public Health Workforce Preparedness",
        "Certificate",
        "Public Health",
        CGHS,
        "Online",
        "Certificate",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "certificate-in-public-health-workforce",
    ),
    seed(
        "Master of Science in Speech-Language Pathology",
        "Master",
        "Speech-Language Pathology",
        ASHS,
        "Residential",
        "MS",
        "https://www.atsu.edu/arizona-school-of-health-sciences/academics/"
        "master-of-science-in-speech-language-pathology",
    ),
    seed(
        "Master of Science in Kinesiology",
        "Master",
        "Kinesiology",
        CGHS,
        "Online",
        "MS",
        "https://www.atsu.edu/college-of-graduate-health-studies/academics/"
        "master-of-science-in-kinesiology",
    ),
    *(
        seed(name, "Certificate", "Kinesiology", CGHS, "Online", "Certificate", KINESIOLOGY_CERTIFICATES_URL)
        for name in (
            "Certificate in Corrective Exercise and Orthopedic Rehabilitation",
            "Certificate in Exercise and Sport Psychology",
            "Certificate in Sports Conditioning",
            "Certificate in Sports Science",
        )
    ),
)


EXACT_REQUIREMENTS: dict[str, dict[str, list]] = {
    "Doctor of Audiology, Entry-Level": {
        "facts": [
            ("Prior degree", "Before matriculation", "Accredited bachelor's degree completed and posted by July 1"),
            ("GPA", "Undergraduate", "3.0 cumulative or final 60 credits; 2.50 science GPA"),
            ("GRE", "Upcoming application cycle", "Not required"),
            ("Recommendations", "CSDCAS", "Three letters"),
            ("English", "Applicants required to demonstrate proficiency", "See ATSU international admissions methods"),
        ],
        "documents": ["Official transcripts", "Three recommendations", "Resume or equivalent experience record"],
    },
    "Doctor of Dental Medicine (ASDOH)": {
        "facts": [
            ("GPA", "Minimum", "2.75 cumulative and science; 3.0 recommended"),
            ("Admissions test", "DAT", "Required; scores may not be older than three years"),
            ("Prior study", "Minimum", "90 semester or 135 quarter hours; bachelor's degree preferred"),
            ("Recommendations", "Minimum", "Two: science faculty or predental committee, and a dentist"),
            ("Deadlines", "Official page listing", "AADSAS Nov 15; DAT Dec 1; secondary application Dec 15"),
        ],
        "documents": ["AADSAS application", "Secondary application and fee", "Official DAT scores", "Two recommendations"],
    },
    "Doctor of Athletic Training": {
        "facts": [
            ("Prior degree", "Minimum", "Master's degree or higher"),
            ("GPA", "Graduate cumulative", "2.75 on a 4.0 scale"),
            ("Professional credential", "Before matriculation", "BOC athletic trainer certification or substantial equivalent"),
            ("Licensure", "Where required", "Proof of current state licensure"),
            ("Recommendation", "Application", "One official recommendation"),
        ],
        "documents": ["Official qualifying-degree transcript", "Professional certification", "State license where required", "Recommendation"],
    },
    "Doctor of Health Administration": {
        "facts": [
            ("Prior degree", "Qualifying degree", "Accredited master's degree or higher"),
            ("GPA", "Qualifying institution", "2.5 cumulative on a 4.0 scale"),
            ("Experience", "Healthcare", "Current leadership position or at least three years of experience"),
            ("English", "Where applicable", "English proficiency required"),
        ],
        "documents": ["Application and fee", "Official qualifying-degree transcript", "Resume", "Essay"],
    },
    "Master of Public Health": {
        "facts": [
            ("Prior degree", "Qualifying degree", "Accredited bachelor's degree"),
            ("GPA", "Qualifying institution", "2.5 cumulative on a 4.0 scale"),
            ("GRE", "Admission", "Not required"),
            ("English", "Where applicable", "English proficiency required"),
        ],
        "documents": ["Application and fee", "Official qualifying-degree transcript", "Resume", "Essay"],
    },
    "Master of Science in Speech-Language Pathology": {
        "facts": [
            ("Prior degree", "Before matriculation", "Bachelor's degree or higher from a regionally accredited institution"),
            ("GPA", "Admission options", "3.0 overall or final 60 credits; holistic review may apply below 3.0"),
            ("Recommendations", "CSDCAS", "Two letters, preferably from faculty"),
            ("English", "Applicants required to demonstrate proficiency", "See ATSU international admissions methods"),
        ],
        "documents": ["CSDCAS application", "Official transcripts", "Two recommendations"],
    },
    "Doctor of Occupational Therapy, Entry-Level": {
        "facts": [
            ("Prior degree", "Before matriculation", "Bachelor's degree from a U.S. regionally accredited institution"),
            ("GPA", "Admission options", "3.0 overall or final 60 credits; holistic review may apply below 3.0"),
            ("Observation", "Occupational therapy", "At least 30 contact hours"),
            ("Recommendations", "Application", "Three letters with specified academic or professional sources"),
            ("English", "Applicants required to demonstrate proficiency", "See ATSU international admissions methods"),
        ],
        "documents": ["OTCAS application", "Official transcripts", "Three recommendations", "Observation-hour evidence"],
    },
    "Doctor of Physical Therapy, Entry-Level": {
        "facts": [
            ("Prior degree", "Before enrollment", "Bachelor's degree from a regionally accredited institution"),
            ("Prerequisites", "Before program start", "Program-listed prerequisite courses must be complete"),
            ("Observation", "Physical therapy", "At least 30 contact hours across varied settings"),
            ("English", "Non-native speakers", "English proficiency required"),
            ("Interview", "Selected candidates", "Required; on-site unless video is approved"),
        ],
        "documents": ["PTCAS application", "Official transcripts", "Prerequisite evidence", "Observation-hour evidence"],
    },
}


class OfficialLinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[tuple[str, str]] = []
        self.current_href = ""
        self.current_text: list[str] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        if tag != "a":
            return
        self.current_href = dict(attrs).get("href") or ""
        self.current_text = []

    def handle_data(self, data: str) -> None:
        if self.current_href:
            self.current_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag != "a" or not self.current_href:
            return
        label = clean_text("".join(self.current_text))
        self.links.append((label, self.current_href))
        self.current_href = ""
        self.current_text = []


class AdmissionSectionParser(HTMLParser):
    """Collect readable blocks from a program page's Admissions section."""

    RELEVANT_HEADINGS = (
        "admission",
        "application",
        "deadline",
        "english",
        "gpa",
        "international",
        "interview",
        "prerequisite",
        "recommendation",
        "selection",
        "test",
    )

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.blocks: list[tuple[str, str]] = []
        self.capture = False
        self.capture_level = 7
        self.heading_tag = ""
        self.heading_text: list[str] = []
        self.section_label = "Admissions"
        self.block_tag = ""
        self.block_text: list[str] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        del attrs
        if tag in {"h2", "h3", "h4", "h5"}:
            self.heading_tag = tag
            self.heading_text = []
            return
        if self.capture and not self.block_tag and tag in {"li", "p"}:
            self.block_tag = tag
            self.block_text = []

    def handle_data(self, data: str) -> None:
        if self.heading_tag:
            self.heading_text.append(data)
        elif self.capture and self.block_tag:
            self.block_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == self.heading_tag:
            heading = clean_text("".join(self.heading_text))
            level = int(tag[1])
            normalized = heading.casefold()
            relevant = any(
                keyword in normalized for keyword in self.RELEVANT_HEADINGS
            )

            if "admission" in normalized:
                self.capture = True
                self.capture_level = min(self.capture_level, level)
                self.section_label = heading
            elif self.capture and relevant:
                self.section_label = heading
            elif self.capture and level <= self.capture_level:
                self.capture = False

            self.heading_tag = ""
            self.heading_text = []
            return

        if tag == self.block_tag:
            value = clean_text("".join(self.block_text))
            if self.capture and 18 <= len(value) <= 900:
                self.blocks.append((self.section_label, value))
            self.block_tag = ""
            self.block_text = []

def clean_text(value: str) -> str:
    return " ".join(value.split())


def stable_id(prefix: str, value: str) -> str:
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]
    return f"{prefix}-{digest}"


def normalized_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.casefold())


def fetch(url: str) -> str:
    request = Request(
        url,
        headers={
            "Accept": "text/html,application/xhtml+xml",
            "User-Agent": f"{USER_AGENT}/1.0 (+https://github.com/RafaelBlackwood)",
        },
    )
    with urlopen(request, timeout=45) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def robots_policy() -> RobotFileParser:
    policy = RobotFileParser()
    policy.set_url(ROBOTS_URL)
    document = fetch(ROBOTS_URL)
    policy.parse(document.splitlines())
    return policy


def looks_like_program(label: str, url: str) -> bool:
    if not label or not url:
        return False
    absolute = urljoin(APPLICATION_DIRECTORY_URL, url)
    parsed = urlparse(absolute)
    if parsed.netloc not in {"atsu.edu", "www.atsu.edu"}:
        return False
    if "/academics/" not in parsed.path and parsed.path not in {
        "/doctor-of-physical-therapy-degree",
        "/physician-assistant-degree",
        "/master-of-public-health-dental-emphasis-dental-public-health-residency",
    }:
        return False
    return label.casefold().startswith(
        (
            "advanced standing",
            "certificate",
            "doctor",
            "graduate certificate",
            "master",
            "neurologic physical therapy residency",
            "orthopedic physical therapy residency",
        )
    )


def infer_level(name: str) -> str:
    lowered = name.casefold()
    if "non-degree" in lowered:
        return "Non-degree"
    if "certificate" in lowered:
        return "Certificate"
    if "residency" in lowered:
        return "Residency"
    if lowered.startswith("doctor"):
        return "Doctorate"
    if lowered.startswith("master"):
        return "Master"
    if "advanced standing" in lowered:
        return "Professional"
    return "Graduate"


def infer_school(url: str) -> str:
    path = urlparse(url).path.casefold()
    if "arizona-school-of-dentistry" in path:
        return ASDOH
    if "arizona-school-of-health" in path:
        return ASHS
    if "college-of-graduate-health" in path:
        return CGHS
    if "college-for-healthy-communities" in path:
        return CHC
    if "kirksville-college" in path:
        return KCOM
    if "missouri-school-of-dentistry" in path:
        return MOSDOH
    if "school-of-osteopathic-medicine" in path:
        return SOMA
    return INSTITUTION_NAME


def discover_programs(document: str) -> list[ProgramSeed]:
    parser = OfficialLinkParser()
    parser.feed(document)
    known_urls = {program.official_url for program in KNOWN_PROGRAMS}
    known_names = {normalized_name(program.name) for program in KNOWN_PROGRAMS}
    discovered: list[ProgramSeed] = []
    seen: set[tuple[str, str]] = set()

    for raw_label, raw_url in parser.links:
        label = clean_text(raw_label)
        url = urljoin(APPLICATION_DIRECTORY_URL, raw_url).split("#", 1)[0]
        key = (normalized_name(label), url)
        if key in seen or not looks_like_program(label, url):
            continue
        seen.add(key)
        if url in known_urls or normalized_name(label) in known_names:
            continue
        discovered.append(
            ProgramSeed(
                name=label,
                level=infer_level(label),
                subject="Health Professions",
                school=infer_school(url),
                delivery_mode="",
                degree="",
                official_url=url,
            )
        )

    return discovered


def fact_label(value: str) -> str:
    normalized = value.casefold()
    if "grade point average" in normalized or re.search(r"\bgpa\b", normalized):
        return "GPA"
    if any(test in normalized for test in ("gre", "gmat", "mcat", "dat ")):
        return "Admissions test"
    if "english" in normalized or "toefl" in normalized or "ielts" in normalized:
        return "English proficiency"
    if "prerequisite" in normalized:
        return "Prerequisites"
    if "recommendation" in normalized or "reference" in normalized:
        return "Recommendations"
    if "transcript" in normalized:
        return "Transcripts"
    if "interview" in normalized:
        return "Interview"
    if "deadline" in normalized or "apply by" in normalized:
        return "Deadline"
    if "degree" in normalized or "baccalaureate" in normalized:
        return "Prior degree"
    if "license" in normalized or "certification" in normalized:
        return "Professional credential"
    if "experience" in normalized or "observation" in normalized:
        return "Experience"
    return "Published requirement"


def documents_from_blocks(blocks: list[tuple[str, str]]) -> list[str]:
    combined = " ".join(value for _, value in blocks).casefold()
    candidates = (
        ("transcript", "Official transcripts"),
        ("resume", "Resume or CV"),
        ("curriculum vitae", "Resume or CV"),
        ("essay", "Essay or personal statement"),
        ("personal statement", "Essay or personal statement"),
        ("recommendation", "Recommendations"),
        ("reference", "Recommendations"),
        ("test score", "Official test scores"),
        ("application fee", "Application and fee"),
        ("credential evaluation", "International credential evaluation"),
        ("state license", "Professional license or certification"),
        ("certification", "Professional license or certification"),
    )
    return list(
        dict.fromkeys(label for needle, label in candidates if needle in combined)
    )


def extract_live_requirements(document: str) -> dict[str, list] | None:
    parser = AdmissionSectionParser()
    parser.feed(document)
    unique_blocks: list[tuple[str, str]] = []
    seen: set[str] = set()

    for section, value in parser.blocks:
        normalized = normalized_name(value)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        unique_blocks.append((section, value))

    if not unique_blocks:
        return None

    facts = [
        {
            "label": fact_label(value),
            "scope": section or "Official admissions section",
            "value": value,
        }
        for section, value in unique_blocks[:16]
    ]
    return {
        "documents": documents_from_blocks(unique_blocks),
        "facts": facts,
    }

def requirement_group(
    program: ProgramSeed,
    updated_at: str,
    live_requirement: dict[str, list] | None = None,
) -> dict:
    requirement_id = stable_id(
        "atsu-requirements", f"{program.name}|{program.official_url}"
    )
    exact = live_requirement or EXACT_REQUIREMENTS.get(program.name)
    if exact and live_requirement:
        facts = exact["facts"]
        documents = exact["documents"]
    elif exact:
        facts = [
            {"label": label, "scope": scope, "value": value}
            for label, scope, value in exact["facts"]
        ]
        documents = exact["documents"]
    else:
        facts = [
            {
                "label": "Requirement scope",
                "scope": "Official ATSU program page",
                "value": "Program-specific; review the current admissions section",
            },
            {
                "label": "Applicant category",
                "scope": "Before applying",
                "value": "Confirm domestic, international, professional, and prerequisite rules",
            },
        ]
        documents = []

    return {
        "documents": documents,
        "facts": facts,
        "id": requirement_id,
        "level": program.level,
        "sourceUrl": program.official_url,
        "supportingSourceUrls": [
            GENERAL_ADMISSIONS_URL,
            INTERNATIONAL_ADMISSIONS_URL,
        ],
        "title": program.name,
        "updatedAt": updated_at,
    }


def program_record(program: ProgramSeed, updated_at: str) -> dict:
    requirement_id = stable_id(
        "atsu-requirements", f"{program.name}|{program.official_url}"
    )
    return {
        "applicationDeadline": (
            "Confirm the current deadline and start date on the official program page"
        ),
        "applicationUrl": APPLICATION_DIRECTORY_URL,
        "deliveryMode": program.delivery_mode,
        "degree": program.degree,
        "durationMonths": None,
        "id": stable_id("atsu-program", f"{program.name}|{program.official_url}"),
        "language": "English",
        "level": program.level,
        "name": program.name,
        "officialUrl": program.official_url,
        "requirementGroupId": requirement_id,
        "school": program.school,
        "subject": program.subject,
        "summary": (
            f"Official ATSU {program.delivery_mode.lower() + ' ' if program.delivery_mode else ''}"
            f"{program.level.lower()} offering in {program.subject}."
        ),
        "updatedAt": updated_at,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Write the reviewed fallback without requesting the live directory.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Fail instead of using the reviewed fallback when the source is unavailable.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    updated_at = datetime.now(timezone.utc).date().isoformat()
    programs = list(KNOWN_PROGRAMS)
    live_requirements: dict[str, dict[str, list]] = {}
    sync_mode = "reviewed-fallback"

    if not args.offline:
        try:
            policy = robots_policy()
            if not policy.can_fetch(USER_AGENT, APPLICATION_DIRECTORY_URL):
                raise RuntimeError("ATSU robots policy disallows the program directory.")
            document = fetch(APPLICATION_DIRECTORY_URL)
            discovered = discover_programs(document)
            programs.extend(discovered)
            sync_mode = "live-directory"

            for url in sorted({program.official_url for program in programs}):
                if not policy.can_fetch(USER_AGENT, url):
                    continue
                try:
                    requirement = extract_live_requirements(fetch(url))
                    if requirement:
                        live_requirements[url] = requirement
                except Exception as error:  # noqa: BLE001 - retain reviewed fallback
                    print(
                        f"Could not refresh ATSU requirements from {url}: {error}",
                        file=sys.stderr,
                    )
                time.sleep(0.2)

            if live_requirements:
                sync_mode = "live-program-pages"
            if args.strict and len(live_requirements) < 8:
                raise RuntimeError(
                    "Fewer than eight ATSU admissions sections were parsed; "
                    "refusing to publish a degraded live snapshot."
                )
        except Exception as error:  # noqa: BLE001 - preserve last reviewed snapshot
            if args.strict:
                raise
            print(
                f"ATSU directory unavailable; using reviewed fallback: {error}",
                file=sys.stderr,
            )

    records = [program_record(program, updated_at) for program in programs]
    requirements = [
        requirement_group(
            program,
            updated_at,
            live_requirements.get(program.official_url),
        )
        for program in programs
    ]
    records.sort(key=lambda item: (item["name"].casefold(), item["school"].casefold()))
    requirements.sort(key=lambda item: item["title"].casefold())

    if len(records) < 40:
        raise RuntimeError(
            f"Refusing to publish an incomplete ATSU catalog ({len(records)} records)."
        )

    output = {
        "catalogUrl": APPLICATION_DIRECTORY_URL,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "institutionId": INSTITUTION_ID,
        "institutionName": INSTITUTION_NAME,
        "programs": records,
        "requirementGroups": requirements,
        "sourceCounts": {
            "exactRequirementSummaries": len(EXACT_REQUIREMENTS),
            "liveRequirementPages": len(live_requirements),
            "officialPrograms": len(records),
            "programRequirementSources": len(requirements),
        },
        "sources": [
            {"label": "ATSU application directory", "url": APPLICATION_DIRECTORY_URL},
            {"label": "ATSU admissions", "url": GENERAL_ADMISSIONS_URL},
            {
                "label": "ATSU international admissions",
                "url": INTERNATIONAL_ADMISSIONS_URL,
            },
            {"label": "ATSU tuition and fees", "url": TUITION_URL},
        ],
        "sourceUpdatedAt": updated_at,
        "syncMode": sync_mode,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {len(records)} ATSU programs and {len(requirements)} "
        f"requirement source records to {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()
