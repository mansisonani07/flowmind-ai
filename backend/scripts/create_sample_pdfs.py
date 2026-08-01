#!/usr/bin/env python3
"""
FlowMind AI - Sample PDF Generator

Creates 3 sample PDF documents for testing the RAG pipeline:
  1. restaurant_menu.pdf   (10 pages)
  2. clinic_services.pdf   (5 pages)
  3. coaching_faq.pdf      (8 pages)

Run from the backend directory:
    python scripts/create_sample_pdfs.py
"""

import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    HRFlowable,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "sample_data")

STYLES = getSampleStyleSheet()

# Custom styles
STYLE_TITLE = ParagraphStyle(
    "CustomTitle",
    parent=STYLES["Title"],
    fontSize=28,
    leading=34,
    spaceAfter=12,
    alignment=TA_CENTER,
    textColor=colors.HexColor("#1a1a2e"),
)

STYLE_SUBTITLE = ParagraphStyle(
    "CustomSubtitle",
    parent=STYLES["Normal"],
    fontSize=14,
    leading=18,
    spaceAfter=6,
    alignment=TA_CENTER,
    textColor=colors.HexColor("#16213e"),
)

STYLE_HEADING = ParagraphStyle(
    "CustomHeading",
    parent=STYLES["Heading2"],
    fontSize=18,
    leading=22,
    spaceBefore=16,
    spaceAfter=10,
    textColor=colors.HexColor("#0f3460"),
    borderPadding=(0, 0, 4, 0),
)

STYLE_SUBHEADING = ParagraphStyle(
    "CustomSubHeading",
    parent=STYLES["Heading3"],
    fontSize=14,
    leading=18,
    spaceBefore=10,
    spaceAfter=6,
    textColor=colors.HexColor("#533483"),
)

STYLE_BODY = ParagraphStyle(
    "CustomBody",
    parent=STYLES["Normal"],
    fontSize=11,
    leading=16,
    spaceAfter=8,
    alignment=TA_JUSTIFY,
)

STYLE_BODY_CENTER = ParagraphStyle(
    "CustomBodyCenter",
    parent=STYLE_BODY,
    alignment=TA_CENTER,
)

STYLE_MENU_ITEM = ParagraphStyle(
    "MenuItem",
    parent=STYLES["Normal"],
    fontSize=12,
    leading=16,
    spaceAfter=2,
    textColor=colors.HexColor("#1a1a2e"),
)

STYLE_MENU_DESC = ParagraphStyle(
    "MenuDesc",
    parent=STYLES["Normal"],
    fontSize=10,
    leading=13,
    spaceAfter=10,
    textColor=colors.HexColor("#555555"),
    leftIndent=12,
)

STYLE_PRICE = ParagraphStyle(
    "Price",
    parent=STYLES["Normal"],
    fontSize=12,
    leading=14,
    alignment=TA_CENTER,
    textColor=colors.HexColor("#e94560"),
    fontName="Helvetica-Bold",
)

STYLE_FOOTER = ParagraphStyle(
    "FooterStyle",
    parent=STYLES["Normal"],
    fontSize=10,
    leading=14,
    alignment=TA_CENTER,
    textColor=colors.HexColor("#666666"),
)

STYLE_FAQ_Q = ParagraphStyle(
    "FAQ_Q",
    parent=STYLES["Normal"],
    fontSize=12,
    leading=16,
    spaceBefore=10,
    spaceAfter=4,
    textColor=colors.HexColor("#0f3460"),
    fontName="Helvetica-Bold",
)

STYLE_FAQ_A = ParagraphStyle(
    "FAQ_A",
    parent=STYLES["Normal"],
    fontSize=11,
    leading=15,
    spaceAfter=12,
    textColor=colors.HexColor("#333333"),
    leftIndent=12,
)


def _build_pdf(path: str, story: list) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    doc = SimpleDocTemplate(path, pagesize=A4, topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    doc.build(story)


def cover_page(title: str, subtitle: str, accent_color=colors.HexColor("#e94560")) -> list:
    """Return flowables for a cover page."""
    return [
        Spacer(1, 2.5 * inch),
        HRFlowable(width="60%", thickness=3, color=accent_color, spaceAfter=20),
        Paragraph(title, STYLE_TITLE),
        Spacer(1, 8),
        Paragraph(subtitle, STYLE_SUBTITLE),
        Spacer(1, 6),
        HRFlowable(width="60%", thickness=3, color=accent_color, spaceBefore=20),
        Spacer(1, 1 * inch),
        Paragraph("Generated for FlowMind AI RAG Pipeline Testing", STYLE_FOOTER),
        PageBreak(),
    ]


def menu_item_row(name: str, description: str, price: str) -> Table:
    """Create a formatted menu-item row as a table."""
    data = [
        [Paragraph(f"<b>{name}</b>", STYLE_MENU_ITEM), Paragraph(price, STYLE_PRICE)],
        [Paragraph(description, STYLE_MENU_DESC), ""],
    ]
    t = Table(data, colWidths=[4.2 * inch, 1.5 * inch])
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LINEBELOW", (0, -1), (-1, -1), 0.5, colors.HexColor("#dddddd")),
            ]
        )
    )
    return t


# ===================================================================
# PDF 1 — Restaurant Menu
# ===================================================================


def _create_restaurant_menu() -> None:
    path = os.path.join(OUTPUT_DIR, "restaurant_menu.pdf")
    story: list = []

    # --- Cover ---
    story.extend(cover_page("Taste of India", "Authentic Indian Restaurant &mdash; Menu"))

    # --- Appetizers (pages 2-3) ---
    story.append(Paragraph("Appetizers", STYLE_HEADING))
    story.append(
        Paragraph(
            "Start your meal with our handcrafted appetisers, prepared with fresh ingredients and traditional spices.",
            STYLE_BODY,
        )
    )
    story.append(Spacer(1, 6))

    appetizers = [
        ("Samosa (2 pcs)", "Crispy golden pastries stuffed with spiced potatoes and green peas, served with mint and tamarind chutneys.", "₹120"),
        ("Paneer Tikka", "Marinated cottage cheese cubes grilled in tandoor with bell peppers and onions.", "₹220"),
        ("Chicken Seekh Kebab", "Minced chicken seasoned with aromatic spices and grilled on skewers.", "₹260"),
        ("Aloo Tikki Chaat", "Fried potato patties topped with yoghurt, tamarind sauce, and crunchy sev.", "₹140"),
        ("Hara Bhara Kebab", "Spinach and green pea patties with cashews and coriander, lightly pan-fried.", "₹180"),
        ("Papdi Chaat", "Crispy wafers layered with chickpeas, potatoes, yoghurt, and sweet-spicy chutneys.", "₹130"),
        ("Tandoori Prawns", "Jumbo prawns marinated in tandoori spices and chargrilled to perfection.", "₹320"),
        ("Spring Rolls (Veg)", "Crispy rolls filled with shredded vegetables and glass noodles, served with sweet chilli sauce.", "₹150"),
        ("Mutton Samosa (2 pcs)", "Flaky pastry filled with tender minced mutton, onions, and aromatic spices.", "₹180"),
    ]
    for name, desc, price in appetizers:
        story.append(menu_item_row(name, desc, price))

    story.append(PageBreak())

    # --- Main Courses (pages 4-6) ---
    story.append(Paragraph("Main Courses", STYLE_HEADING))
    story.append(
        Paragraph(
            "Our signature mains feature slow-cooked curries, fragrant biryanis, and sizzling tandoori dishes.",
            STYLE_BODY,
        )
    )
    story.append(Spacer(1, 6))

    story.append(Paragraph("Biryani &amp; Rice", STYLE_SUBHEADING))
    mains_biryani = [
        ("Hyderabadi Chicken Biryani", "Aromatic basmati rice layered with spiced chicken, saffron, and fried onions. Served with raita.", "₹320"),
        ("Veg Biryani", "Mixed vegetables cooked with fragrant basmati rice, whole spices, and fresh herbs.", "₹250"),
        ("Mutton Biryani", "Tender mutton pieces slow-cooked with aged basmati rice and a secret blend of 15 spices.", "₹380"),
        ("Jeera Rice", "Steamed basmati rice tempered with cumin seeds and ghee.", "₹160"),
    ]
    for name, desc, price in mains_biryani:
        story.append(menu_item_row(name, desc, price))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Curries", STYLE_SUBHEADING))
    mains_curry = [
        ("Butter Chicken", "Creamy tomato-based curry with tender chicken pieces, finished with butter and cream.", "₹300"),
        ("Palak Paneer", "Cottage cheese cubes in a velvety spinach gravy with garlic and cumin.", "₹240"),
        ("Rogan Josh", "Slow-braised mutton in a rich Kashmiri chilli and yogurt gravy.", "₹340"),
        ("Dal Makhani", "Black lentils and kidney beans simmered overnight with butter and cream.", "₹220"),
        ("Chole Bhature", "Spicy chickpea curry served with fluffy deep-fried bread.", "₹200"),
        ("Kadai Paneer", "Paneer and bell peppers cooked in a kadai with tomato, onion, and whole spices.", "₹260"),
    ]
    for name, desc, price in mains_curry:
        story.append(menu_item_row(name, desc, price))

    story.append(PageBreak())

    story.append(Paragraph("Tandoori Specials", STYLE_SUBHEADING))
    mains_tandoori = [
        ("Tandoori Chicken (Full)", "Whole chicken marinated in yoghurt and tandoori spices, chargrilled in a clay oven.", "₹450"),
        ("Fish Tikka", "Boneless fish fillets marinated with ajwain and lemon, grilled in tandoor.", "₹380"),
        ("Paneer Tandoori Platter", "Assorted paneer tikka, malai paneer, and paneer tikka masala on a sizzling platter.", "₹320"),
    ]
    for name, desc, price in mains_tandoori:
        story.append(menu_item_row(name, desc, price))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Breads", STYLE_SUBHEADING))
    breads = [
        ("Butter Naan", "Soft leavened bread brushed with melted butter.", "₹60"),
        ("Garlic Naan", "Naan topped with minced garlic and coriander.", "₹80"),
        ("Laccha Paratha", "Layered flaky whole wheat bread cooked on a hot griddle.", "₹70"),
        ("Missi Roti", "Gram flour flatbread with onions and spices.", "₹60"),
    ]
    for name, desc, price in breads:
        story.append(menu_item_row(name, desc, price))

    story.append(PageBreak())

    # --- Desserts (page 7) ---
    story.append(Paragraph("Desserts", STYLE_HEADING))
    story.append(
        Paragraph(
            "Indulge in our traditional Indian desserts, made fresh every day.",
            STYLE_BODY,
        )
    )
    story.append(Spacer(1, 6))

    desserts = [
        ("Gulab Jamun (2 pcs)", "Deep-fried milk dumplings soaked in rose-cardamom sugar syrup.", "₹120"),
        ("Rasmalai", "Soft paneer discs served in chilled saffron-cardamom milk.", "₹150"),
        ("Kulfi (Assorted)", "Traditional Indian ice cream available in mango, pistachio, and malai flavours.", "₹100"),
        ("Gajar Ka Halwa", "Grated carrots slow-cooked with milk, sugar, and dry fruits.", "₹140"),
        ("Jalebi with Rabdi", "Crispy spirals of fermented batter soaked in saffron syrup, served with thickened milk.", "₹130"),
        ("Moong Dal Halwa", "Rich and fudgy dessert made from moong lentils, ghee, and dry fruits.", "₹160"),
    ]
    for name, desc, price in desserts:
        story.append(menu_item_row(name, desc, price))

    story.append(PageBreak())

    # --- Beverages (pages 8-9) ---
    story.append(Paragraph("Beverages", STYLE_HEADING))
    story.append(
        Paragraph(
            "Refreshing drinks to complement your meal.",
            STYLE_BODY,
        )
    )
    story.append(Spacer(1, 6))

    story.append(Paragraph("Hot Beverages", STYLE_SUBHEADING))
    hot_drinks = [
        ("Masala Chai", "Traditional Indian spiced tea with ginger, cardamom, and cloves.", "₹50"),
        ("Filter Coffee", "South Indian style filter coffee with frothed milk.", "₹60"),
        ("Kashmiri Kahwa", "Green tea infused with saffron, cinnamon, and almonds.", "₹90"),
        ("Hot Chocolate", "Rich and creamy hot chocolate topped with whipped cream.", "₹120"),
    ]
    for name, desc, price in hot_drinks:
        story.append(menu_item_row(name, desc, price))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Cold Beverages", STYLE_SUBHEADING))
    cold_drinks = [
        ("Mango Lassi", "Thick yoghurt smoothie blended with fresh Alphonso mango pulp.", "₹120"),
        ("Sweet Lassi", "Classic creamy yoghurt drink, lightly sweetened.", "₹90"),
        ("Thandai", "Chilled milk drink with almonds, fennel, rose petals, and spices.", "₹110"),
        ("Fresh Lime Soda", "Refreshing lime juice with soda water, available sweet or salted.", "₹70"),
    ]
    for name, desc, price in cold_drinks:
        story.append(menu_item_row(name, desc, price))

    story.append(PageBreak())

    # --- Contact Info (page 10) ---
    story.append(Paragraph("Visit Us", STYLE_HEADING))
    story.append(Spacer(1, 12))
    contact_data = [
        ["Address", "42 MG Road, Near City Mall, Koramangala, Bengaluru, Karnataka 560034"],
        ["Phone", "+91 98765 43210"],
        ["Email", "info@tasteofindia.example.com"],
        ["Website", "www.tasteofindia.example.com"],
        ["Instagram", "@tasteofindia.blr"],
        ["Facebook", "facebook.com/tasteofindia.blr"],
        ["Hours", "Monday – Sunday: 11:00 AM to 11:00 PM"],
        ["Kitchen Hours", "Last order at 10:15 PM"],
        ["Parking", "Free valet parking available for dine-in guests"],
    ]
    contact_table = Table(contact_data, colWidths=[1.8 * inch, 4.5 * inch])
    contact_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 11),
                ("LEADING", (0, 0), (-1, -1), 16),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#0f3460")),
                ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#333333")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#eeeeee")),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f8f9fa")),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f8f9fa")),
            ]
        )
    )
    story.append(contact_table)
    story.append(Spacer(1, 30))
    story.append(
        Paragraph(
            "We look forward to serving you! Reserve a table by calling us or booking online.",
            STYLE_BODY_CENTER,
        )
    )
    story.append(Spacer(1, 8))
    story.append(Paragraph("\u00a9 2025 Taste of India. All rights reserved.", STYLE_FOOTER))

    _build_pdf(path, story)
    print(f"  \u2713 {path}")


# ===================================================================
# PDF 2 — Clinic Services
# ===================================================================


def _create_clinic_services() -> None:
    path = os.path.join(OUTPUT_DIR, "clinic_services.pdf")
    story: list = []

    # --- Cover ---
    story.extend(cover_page("HealthFirst Clinic", "Services &amp; Pricing Guide"))

    # --- General Checkup (page 2) ---
    story.append(Paragraph("General Checkup Services", STYLE_HEADING))
    story.append(
        Paragraph(
            "Our general health checkup packages are designed for preventive care and early detection of common health conditions.",
            STYLE_BODY,
        )
    )
    story.append(Spacer(1, 8))

    checkup_data = [
        ["Service", "Includes", "Price"],
        ["Basic Health Checkup", "CBC, Blood Sugar, Blood Pressure, BMI, ECG", "₹1,500"],
        ["Comprehensive Health Package", "Basic + Lipid Profile, Liver Function, Kidney Function, Thyroid, Urine Analysis, Chest X-Ray", "₹3,500"],
        ["Executive Health Package", "Comprehensive + Echocardiogram, TMT, Abdominal Ultrasound, PSA (Men) / Pap Smear (Women)", "₹6,000"],
        ["Diabetic Screening Package", "HbA1c, Fasting &amp; Post-Prandial Sugar, Kidney Function, Eye Examination, Foot Screening", "₹2,500"],
    ]
    checkup_table = Table(checkup_data, colWidths=[2.0 * inch, 3.2 * inch, 1.1 * inch])
    checkup_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f3460")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("LEADING", (0, 0), (-1, -1), 14),
                ("ALIGN", (2, 0), (2, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f4f6fc")]),
            ]
        )
    )
    story.append(checkup_table)

    story.append(PageBreak())

    # --- Specialist Consultations (page 3) ---
    story.append(Paragraph("Specialist Consultations", STYLE_HEADING))
    story.append(
        Paragraph(
            "Our team of experienced specialists provides expert consultations across a range of medical fields.",
            STYLE_BODY,
        )
    )
    story.append(Spacer(1, 8))

    specialist_data = [
        ["Specialist", "Availability", "Consultation Fee"],
        ["General Physician", "Mon – Sat", "₹600"],
        ["Cardiologist", "Mon, Wed, Fri", "₹1,200"],
        ["Dermatologist", "Tue, Thu, Sat", "₹800"],
        ["Paediatrician", "Mon – Sat", "₹700"],
        ["Orthopaedic Surgeon", "Mon, Wed, Fri", "₹1,000"],
        ["Gynaecologist", "Mon – Fri", "₹900"],
        ["ENT Specialist", "Tue, Thu, Sat", "₹800"],
        ["Neurologist", "Mon, Thu", "₹1,500"],
    ]
    spec_table = Table(specialist_data, colWidths=[2.2 * inch, 1.8 * inch, 1.8 * inch])
    spec_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f3460")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("LEADING", (0, 0), (-1, -1), 14),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f4f6fc")]),
            ]
        )
    )
    story.append(spec_table)

    story.append(PageBreak())

    # --- Emergency, Lab Tests, Health Packages (page 4) ---
    story.append(Paragraph("Emergency Services", STYLE_HEADING))
    story.append(Paragraph("HealthFirst Clinic operates a 24/7 emergency department equipped to handle urgent medical situations. Our emergency team includes on-call physicians and nurses at all times.", STYLE_BODY))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Emergency Call: <b>+91 11223 44556</b> (24/7)", STYLE_BODY_CENTER))
    story.append(Spacer(1, 14))

    story.append(Paragraph("Laboratory Tests", STYLE_HEADING))
    lab_data = [
        ["Test", "Turnaround", "Price"],
        ["Complete Blood Count (CBC)", "Same day", "₹400"],
        ["Lipid Profile", "Same day", "₹600"],
        ["Thyroid Panel (T3, T4, TSH)", "Next day", "₹700"],
        ["HbA1c", "Same day", "₹350"],
        ["Vitamin D", "2 days", "₹900"],
        ["Vitamin B12", "Next day", "₹600"],
        ["Liver Function Test", "Same day", "₹800"],
        ["Kidney Function Test", "Same day", "₹700"],
    ]
    lab_table = Table(lab_data, colWidths=[2.8 * inch, 1.5 * inch, 1.1 * inch])
    lab_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f3460")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("LEADING", (0, 0), (-1, -1), 14),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f4f6fc")]),
            ]
        )
    )
    story.append(lab_table)

    story.append(PageBreak())

    # --- Contact (page 5) ---
    story.append(Paragraph("Contact Information", STYLE_HEADING))
    story.append(Spacer(1, 12))
    clinic_contact = [
        ["Clinic Name", "HealthFirst Clinic"],
        ["Address", "15 Nehru Street, Jayanagar 4th Block, Bengaluru, Karnataka 560041"],
        ["Phone (Reception)", "+91 99887 76655"],
        ["Emergency (24/7)", "+91 11223 44556"],
        ["Email", "info@healthfirstclinic.example.com"],
        ["Website", "www.healthfirstclinic.example.com"],
        ["Appointments", "Call or book online at our website"],
        ["Timings", "Monday – Saturday: 8:00 AM to 8:00 PM"],
        ["Sunday", "Closed (Emergency services available 24/7)"],
        ["Parking", "Free parking for up to 2 hours"],
        ["Insurance", "Accepting major health insurance plans (Star, ICICI Lombard, HDFC ERGO, etc.)"],
    ]
    clinic_table = Table(clinic_contact, colWidths=[1.8 * inch, 4.5 * inch])
    clinic_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 11),
                ("LEADING", (0, 0), (-1, -1), 16),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#0f3460")),
                ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#333333")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#eeeeee")),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f8f9fa")),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f8f9fa")),
            ]
        )
    )
    story.append(clinic_table)
    story.append(Spacer(1, 30))
    story.append(
        Paragraph("For emergencies, please call our 24/7 helpline directly.", STYLE_BODY_CENTER)
    )
    story.append(Spacer(1, 8))
    story.append(Paragraph("\u00a9 2025 HealthFirst Clinic. All rights reserved.", STYLE_FOOTER))

    _build_pdf(path, story)
    print(f"  \u2713 {path}")


# ===================================================================
# PDF 3 — Coaching FAQ
# ===================================================================


def _create_coaching_faq() -> None:
    path = os.path.join(OUTPUT_DIR, "coaching_faq.pdf")
    story: list = []

    # --- Cover ---
    story.extend(cover_page("Excel Academy", "Coaching Classes — Courses, Fees &amp; FAQ"))

    # --- About Us (page 2) ---
    story.append(Paragraph("About Excel Academy", STYLE_HEADING))
    story.append(Paragraph(
        "Excel Academy has been a trusted name in coaching and tutoring for over 12 years. "
        "Founded with a mission to provide quality education at affordable prices, we have helped "
        "thousands of students achieve academic excellence and secure admissions in top colleges and "
        "universities across India.",
        STYLE_BODY,
    ))
    story.append(Paragraph(
        "Our team of 25+ experienced educators specialises in Mathematics, Science, English, and "
        "Computer Science. We offer both regular batch coaching and crash courses for exam preparation. "
        "Our students consistently rank among the top performers in board examinations and competitive "
        "entrance tests such as JEE, NEET, and Olympiads.",
        STYLE_BODY,
    ))
    story.append(Paragraph(
        "At Excel Academy, we believe in a student-centric approach. Our small batch sizes (maximum "
        "15 students per batch) ensure personalised attention for every learner. We use a blend of "
        "traditional teaching methods and modern digital tools, including interactive whiteboards, "
        "online practice platforms, and regular progress-tracking dashboards that parents can access "
        "at any time.",
        STYLE_BODY,
    ))

    story.append(PageBreak())

    # --- Courses Offered (pages 3-4) ---
    story.append(Paragraph("Courses Offered", STYLE_HEADING))
    story.append(Spacer(1, 6))

    courses_data = [
        ["Course", "Grade / Level", "Duration", "Fees (Monthly)", "Batch Timings"],
        ["Mathematics (Regular)", "Class 8 – 10", "Full Academic Year", "₹2,500", "Mon, Wed, Fri — 4:00–5:30 PM"],
        ["Mathematics (Advanced)", "Class 11 – 12 / JEE", "Full Academic Year", "₹4,000", "Tue, Thu, Sat — 4:00–6:00 PM"],
        ["Science (Physics, Chemistry, Biology)", "Class 8 – 10", "Full Academic Year", "₹3,000", "Mon, Wed, Fri — 6:00–7:30 PM"],
        ["Physics (JEE/NEET)", "Class 11 – 12", "Full Academic Year", "₹4,500", "Tue, Thu, Sat — 10:00 AM–12:00 PM"],
        ["Chemistry (JEE/NEET)", "Class 11 – 12", "Full Academic Year", "₹4,500", "Mon, Wed, Fri — 10:00 AM–12:00 PM"],
        ["English Grammar &amp; Literature", "Class 8 – 10", "Full Academic Year", "₹2,000", "Sat, Sun — 10:00–11:30 AM"],
        ["Spoken English &amp; Communication", "All Levels", "3 Months", "₹3,000", "Sat, Sun — 2:00–3:30 PM"],
        ["Coding (Python)", "Class 8 – 12", "6 Months", "₹3,500", "Tue, Thu — 6:00–7:30 PM"],
        ["Coding (Web Development)", "Class 10 – 12 / Adults", "6 Months", "₹4,500", "Sat, Sun — 4:00–6:00 PM"],
        ["Olympiad Prep (Math &amp; Science)", "Class 6 – 10", "4 Months", "₹3,000", "Sat, Sun — 12:00–1:30 PM"],
        ["Crash Course – Board Exams", "Class 10, 12", "2 Months", "₹5,000", "Daily — 8:00–10:00 AM"],
    ]
    courses_table = Table(courses_data, colWidths=[1.8 * inch, 1.1 * inch, 0.9 * inch, 0.9 * inch, 1.8 * inch])
    courses_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f3460")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("LEADING", (0, 0), (-1, -1), 11),
                ("ALIGN", (2, 0), (3, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f4f6fc")]),
            ]
        )
    )
    story.append(courses_table)

    story.append(PageBreak())

    # --- Fees Structure (page 5) ---
    story.append(Paragraph("Fees Structure", STYLE_HEADING))
    story.append(
        Paragraph(
            "The following table provides a summary of one-time and recurring fees. All amounts are in Indian Rupees (INR). A 10% discount is available for siblings enrolling together.",
            STYLE_BODY,
        )
    )
    story.append(Spacer(1, 8))

    fees_data = [
        ["Fee Type", "Amount", "Notes"],
        ["Admission Fee (One-time)", "₹1,000", "Non-refundable, payable at the time of enrollment"],
        ["Study Material Fee (Annual)", "₹2,000", "Includes printed notes, worksheets, and practice papers"],
        ["Monthly Tuition — Class 8–10", "₹2,000 – ₹3,000", "Varies by subject and number of subjects enrolled"],
        ["Monthly Tuition — Class 11–12 / Competitive", "₹4,000 – ₹5,000", "JEE / NEET advanced batches"],
        ["Crash Course (Board Exams)", "₹5,000", "2-month intensive preparation"],
        ["Crash Course (Olympiad)", "₹3,000", "4-month preparation"],
        ["Late Payment Surcharge", "₹200", "Applied if fees are paid after the 10th of the month"],
        ["Lab / Practical Session Fee", "₹500 (quarterly)", "For Science practical sessions (Class 11–12)"],
    ]
    fees_table = Table(fees_data, colWidths=[2.2 * inch, 1.4 * inch, 3.0 * inch])
    fees_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f3460")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("LEADING", (0, 0), (-1, -1), 13),
                ("ALIGN", (1, 0), (1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f4f6fc")]),
            ]
        )
    )
    story.append(fees_table)

    story.append(PageBreak())

    # --- Timings (page 6) ---
    story.append(Paragraph("Batch Timings", STYLE_HEADING))
    story.append(
        Paragraph(
            "Excel Academy offers flexible batch timings to accommodate school schedules and working professionals.",
            STYLE_BODY,
        )
    )
    story.append(Spacer(1, 8))

    story.append(Paragraph("Morning Batches", STYLE_SUBHEADING))
    morning = [
        ("8:00 AM – 10:00 AM", "Board Exam Crash Course (Daily)"),
        ("10:00 AM – 12:00 PM", "JEE/NEET Physics &amp; Chemistry"),
        ("10:00 AM – 11:30 AM", "Olympiad Preparation (Sat &amp; Sun only)"),
    ]
    for time, desc in morning:
        story.append(Paragraph(f"<b>{time}</b> &mdash; {desc}", STYLE_BODY))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Afternoon Batches", STYLE_SUBHEADING))
    afternoon = [
        ("2:00 PM – 3:30 PM", "Spoken English &amp; Communication (Sat &amp; Sun)"),
        ("4:00 PM – 5:30 PM", "Mathematics (Class 8–10)"),
        ("4:00 PM – 6:00 PM", "Advanced Mathematics (Class 11–12 / JEE)"),
    ]
    for time, desc in afternoon:
        story.append(Paragraph(f"<b>{time}</b> &mdash; {desc}", STYLE_BODY))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Evening Batches", STYLE_SUBHEADING))
    evening = [
        ("6:00 PM – 7:30 PM", "Science (Class 8–10)"),
        ("6:00 PM – 7:30 PM", "Coding – Python (Tue &amp; Thu)"),
        ("7:30 PM – 9:00 PM", "Coding – Web Development (Sat &amp; Sun)"),
    ]
    for time, desc in evening:
        story.append(Paragraph(f"<b>{time}</b> &mdash; {desc}", STYLE_BODY))

    story.append(Spacer(1, 12))
    story.append(Paragraph("Weekend Special Batches", STYLE_SUBHEADING))
    story.append(Paragraph("Saturday and Sunday batches are reserved for Olympiad prep, spoken English, web development, and special doubt-clearing sessions. Individual slots may be booked for one-on-one tutoring at an additional fee of ₹500 per hour.", STYLE_BODY))

    story.append(PageBreak())

    # --- Admission Process (page 7) ---
    story.append(Paragraph("Admission Process", STYLE_HEADING))
    story.append(
        Paragraph(
            "Follow these simple steps to enrol at Excel Academy:",
            STYLE_BODY,
        )
    )
    story.append(Spacer(1, 8))

    steps = [
        (
            "Step 1 — Enquiry",
            "Visit our centre or call us to discuss your requirements. Our counsellor will help you choose the right course and batch based on the student's grade, goals, and schedule.",
        ),
        (
            "Step 2 — Free Assessment Test",
            "We conduct a free diagnostic test to understand the student's current level. This helps us place the student in the appropriate batch and identify areas that need focus.",
        ),
        (
            "Step 3 — Course Selection &amp; Batch Allocation",
            "Based on the assessment and discussion, we recommend the best course and batch. You will receive a batch schedule and fee breakdown.",
        ),
        (
            "Step 4 — Registration &amp; Fee Payment",
            "Fill out the registration form (available at the centre or downloadable from our website). Pay the admission fee and first month's tuition to confirm enrollment.",
        ),
        (
            "Step 5 — Orientation &amp; First Class",
            "Attend the orientation session (held on the first Saturday of every month) where you will meet the faculty, receive study materials, and get familiar with our digital tools.",
        ),
    ]
    for i, (step_title, step_desc) in enumerate(steps):
        step_style = ParagraphStyle(
            f"StepTitle{i}",
            parent=STYLE_SUBHEADING,
            spaceBefore=14,
        )
        story.append(Paragraph(step_title, step_style))
        story.append(Paragraph(step_desc, STYLE_BODY))

    story.append(PageBreak())

    # --- FAQ (page 8) ---
    story.append(Paragraph("Frequently Asked Questions", STYLE_HEADING))
    story.append(Spacer(1, 6))

    faqs = [
        (
            "What is the student-to-teacher ratio at Excel Academy?",
            "We maintain a maximum of 15 students per batch to ensure personalised attention. Some specialised batches may have as few as 8 students.",
        ),
        (
            "Do you offer online classes?",
            "Yes, all our courses are available in hybrid mode. Students can attend either in-person at our centre or join via live Zoom sessions. All classes are recorded and available for later review.",
        ),
        (
            "What safety measures are in place at the academy?",
            "Our centre is equipped with CCTV surveillance, fire safety equipment, and first aid kits. All staff have undergone background verification. The premises are sanitised daily.",
        ),
        (
            "Can I switch batches or courses mid-term?",
            "Yes, batch and course changes are permitted subject to availability. A batch change request can be raised at the front desk and is typically processed within 2 working days at no extra cost.",
        ),
        (
            "How are parents kept informed about student progress?",
            "We provide monthly progress reports via email and WhatsApp. Parents can also access our online dashboard to view attendance, test scores, and teacher remarks in real time.",
        ),
        (
            "Is there a refund policy if my child wants to discontinue?",
            "The admission fee is non-refundable. Tuition fees for the current month are not refundable. If discontinuation is notified before the 5th of the month, no further fees will be charged.",
        ),
        (
            "Do you provide study materials and test papers?",
            "Yes, all study materials (printed notes, worksheets, formula sheets, and practice papers) are included in the annual study material fee. Additional reference books may be recommended but are optional.",
        ),
        (
            "What competitive exams do your students prepare for?",
            "Our students prepare for JEE (Main &amp; Advanced), NEET, KVPY, NSTSE, SOF Olympiads (Mathematics, Science, English), and NTSE. We also offer board exam preparation for CBSE and ICSE students.",
        ),
    ]
    for q, a in faqs:
        story.append(Paragraph(f"Q: {q}", STYLE_FAQ_Q))
        story.append(Paragraph(f"A: {a}", STYLE_FAQ_A))

    story.append(Spacer(1, 30))
    story.append(
        Paragraph("Still have questions? Contact us at +91 88776 66544 or email admissions@excelacademy.example.com", STYLE_BODY_CENTER)
    )
    story.append(Spacer(1, 8))
    story.append(Paragraph("\u00a9 2025 Excel Academy. All rights reserved.", STYLE_FOOTER))

    _build_pdf(path, story)
    print(f"  \u2713 {path}")


# ===================================================================
# Main
# ===================================================================


def create_all_sample_pdfs() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Generating sample PDFs for FlowMind AI...")
    _create_restaurant_menu()
    _create_clinic_services()
    _create_coaching_faq()
    print("Done!")


if __name__ == "__main__":
    create_all_sample_pdfs()
    print("All sample PDFs created in backend/sample_data/")
