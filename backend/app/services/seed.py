"""Seed demo content and admin user.

Usage:
  cd backend && python -m app.services.seed
"""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.article import Article
from app.models.branch import Branch
from app.models.currency import Currency
from app.models.faq import Faq
from app.models.service import Service
from app.models.site_setting import SiteSetting
from app.models.user import AppRole, User, UserRole

CURRENCIES = [
    ("USD", "دالر آمریکا", "🇺🇸", Decimal("65.63"), Decimal("65.77"), 1),
    ("EUR", "یورو", "🇪🇺", Decimal("76.10"), Decimal("76.42"), 2),
    ("IRR", "تومان ایران", "🇮🇷", Decimal("338.87"), Decimal("342.33"), 3),
    ("CNY", "یوان چین", "🇨🇳", Decimal("9.12"), Decimal("9.24"), 4),
    ("AED", "درهم امارات", "🇦🇪", Decimal("17.86"), Decimal("17.95"), 5),
    ("GBP", "پوند انگلیس", "🇬🇧", Decimal("88.40"), Decimal("88.90"), 6),
    ("TRY", "لیر ترکیه", "🇹🇷", Decimal("1.62"), Decimal("1.68"), 7),
    ("PKR", "روپیه پاکستان", "🇵🇰", Decimal("0.23"), Decimal("0.25"), 8),
    ("SEK", "کرون سویدن", "🇸🇪", Decimal("6.76"), Decimal("6.90"), 9),
    ("AUD", "دالر استرالیا", "🇦🇺", Decimal("46.16"), Decimal("46.25"), 10),
]

SERVICES = [
    (
        "hawala-yuan",
        "حواله یوان به چین",
        "انتقال سریع یوان به حساب بانکی، علی‌پی و وی‌چت‌پی در سراسر چین با کارمزد رقابتی.",
        "landmark",
        1,
    ),
    (
        "alipay",
        "شارژ حساب علی‌پی",
        "شارژ آنی کیف پول Alipay برای خرید و پرداخت‌های آنلاین در چین.",
        "wallet",
        2,
    ),
    (
        "wechat",
        "حواله وی‌چت پی",
        "ارسال وجه به کیف پول WeChat Pay گیرنده با تایید لحظه‌ای.",
        "message-circle",
        3,
    ),
    (
        "exchange",
        "تبادل ارز",
        "خرید و فروش دالر، یورو، درهم و سایر ارزها با نرخ لحظه‌ای بازار.",
        "coins",
        4,
    ),
    (
        "hawala-world",
        "حواله بین‌المللی",
        "ارسال و دریافت حواله به کشورهای همسایه و اروپا از طریق شبکه نمایندگی‌ها.",
        "globe",
        5,
    ),
    (
        "business",
        "خدمات بازرگانی",
        "گشایش اعتبار، پرداخت فاکتور و تسویه حساب برای تجار و شرکت‌ها.",
        "briefcase",
        6,
    ),
]

BRANCHES = [
    (
        "دفتر مرکزی",
        "کابل",
        "افغانستان",
        "سرای شهزاده، بازار ارز، طبقه دوم",
        "+93 70 000 0000",
        "+93 70 000 0000",
        1,
    ),
    (
        "نمایندگی هرات",
        "هرات",
        "افغانستان",
        "چوک گلها، مارکت صرافان",
        "+93 79 000 0000",
        "+93 79 000 0000",
        2,
    ),
    (
        "نمایندگی دبی",
        "دبی",
        "امارات",
        "دیره، بازار طلا، ساختمان الفهیدی",
        "+971 50 000 0000",
        "+971 50 000 0000",
        3,
    ),
]

ARTICLES = [
    (
        "wechat-transfer",
        "حواله وی‌چت پی (WeChat Pay)",
        "اگر قصد ارسال یوان به چین را دارید، علاوه بر شارژ حساب علی‌پی، امکان انتقال وجه از طریق وی‌چت پی نیز فراهم است.",
        "با خدمت حواله وی‌چت پی می‌توانید یوان را با سرعت، امنیت و کارمزد رقابتی به حساب یا کیف پول وی‌چت گیرنده در چین ارسال کنید. کافی است شناسه وی‌چت گیرنده و مبلغ مورد نظر را ثبت کنید؛ کارشناسان ما نرخ روز را تایید کرده و حواله در کمتر از چند دقیقه انجام می‌شود.",
    ),
    (
        "alipay-guide",
        "راهنمای شارژ علی‌پی و پرداخت در چین",
        "آموزش کامل شارژ حساب Alipay و استفاده از آن برای پرداخت‌های آنلاین و حضوری در چین.",
        "برای شارژ حساب علی‌پی تنها به شناسه حساب و مبلغ نیاز دارید. پس از ثبت درخواست، مبلغ به یوان تبدیل و به کیف پول شما واریز می‌شود. از این موجودی می‌توانید برای خرید از تاوبائو، پرداخت هتل و حمل‌ونقل در چین استفاده کنید.",
    ),
    (
        "rate-guide",
        "نرخ برابری اسعار چگونه تعیین می‌شود؟",
        "تفاوت نرخ برابری بازار و نرخ حواله و عواملی که بر قیمت ارز تاثیر می‌گذارند.",
        "نرخ برابری اسعار بر اساس عرضه و تقاضای بازار داخلی، نرخ‌های جهانی و هزینه انتقال تعیین می‌شود. نرخ حواله معمولاً با نرخ برابری تفاوت دارد، زیرا شامل هزینه انتقال بین‌المللی و کارمزد نماینده مقصد است.",
    ),
]

ABOUT_BODY = (
    "صرافی سروری فعالیت خود را با هدف ارائه خدمات حواله و تبادل ارز شفاف و سریع آغاز کرد. "
    "امروز با شبکه‌ای از دفاتر و نمایندگی‌ها در افغانستان، امارات و چین، خدمات خود را به افراد، "
    "بازرگانان و شرکت‌ها ارائه می‌کنیم.\n\n"
    "تمرکز ما بر سه اصل است: نرخ منصفانه، سرعت انتقال و پاسخگویی. تمام درخواست‌های حواله در سیستم "
    "اختصاصی ما ثبت شده و مشتری می‌تواند وضعیت آن را در پنل کاربری خود پیگیری کند.\n\n"
    "همچنین برای تجاری که با چین کار می‌کنند، خدمات تخصصی شارژ علی‌پی، حواله وی‌چت‌پی و تسویه فاکتور فراهم شده است."
)

SITE_SETTINGS: list[tuple[str, str, str, str, str, str | None, int]] = [
    ("brand.name", "brand", "نام برند", "صرافی سروری", "text", None, 0),
    (
        "brand.tagline",
        "brand",
        "شعار اصلی",
        "حواله، تبادل ارز و پرداخت‌های بین‌المللی",
        "text",
        "در صفحه اصلی و عنوان صفحات نمایش داده می‌شود",
        1,
    ),
    (
        "brand.description",
        "brand",
        "معرفی کوتاه",
        "نرخ لحظه‌ای اسعار، حواله یوان به چین، شارژ علی‌پی و وی‌چت‌پی و خدمات بازرگانی با شبکه نمایندگی‌های مطمئن.",
        "textarea",
        None,
        2,
    ),
    (
        "brand.founded_year",
        "brand",
        "سال شروع فعالیت",
        "2008",
        "text",
        "سال میلادی؛ تعداد سال تجربه در سایت از روی همین مقدار محاسبه می‌شود",
        3,
    ),
    ("contact.phone", "contact", "شماره تماس", "+93 70 000 0000", "text", None, 1),
    ("contact.whatsapp", "contact", "شماره واتساپ", "+93700000000", "text", "بدون فاصله و علائم", 2),
    ("contact.email", "contact", "ایمیل", "info@sarafisarwari.com", "text", None, 3),
    (
        "contact.address",
        "contact",
        "آدرس دفتر مرکزی",
        "کابل، سرای شهزاده، بازار ارز، طبقه دوم",
        "textarea",
        None,
        4,
    ),
    ("contact.hours", "contact", "ساعات کاری", "شنبه تا پنجشنبه، ۸:۰۰ تا ۱۷:۰۰", "text", None, 5),
    (
        "about.hero_description",
        "about",
        "توضیح بالای صفحه",
        "بیش از هجده سال تجربه در حواله بین‌المللی، تبادل اسعار و خدمات بازرگانی با تکیه بر اعتماد مشتریان.",
        "textarea",
        "زیر عنوان صفحه درباره ما نمایش داده می‌شود",
        0,
    ),
    (
        "about.body",
        "about",
        "متن درباره ما",
        ABOUT_BODY,
        "longtext",
        "هر پاراگراف را در یک خط جدا بنویسید",
        1,
    ),
    ("about.value1_title", "about", "عنوان ارزش ۱", "اعتماد", "text", None, 2),
    (
        "about.value1_text",
        "about",
        "متن ارزش ۱",
        "هر حواله با ثبت شفاف و پیگیری در پنل مشتری انجام می‌شود.",
        "textarea",
        None,
        3,
    ),
    ("about.value2_title", "about", "عنوان ارزش ۲", "نرخ منصفانه", "text", None, 4),
    (
        "about.value2_text",
        "about",
        "متن ارزش ۲",
        "نرخ‌ها بر اساس بازار روز تعیین می‌شود تا هزینه انتقال روشن باشد.",
        "textarea",
        None,
        5,
    ),
    ("about.value3_title", "about", "عنوان ارزش ۳", "پاسخگویی", "text", None, 6),
    (
        "about.value3_text",
        "about",
        "متن ارزش ۳",
        "کارشناسان ما وضعیت درخواست را تا تکمیل حواله پیگیری می‌کنند.",
        "textarea",
        None,
        7,
    ),
    ("about.value4_title", "about", "عنوان ارزش ۴", "تعهد", "text", None, 8),
    (
        "about.value4_text",
        "about",
        "متن ارزش ۴",
        "شبکه نمایندگی‌ها در افغانستان، امارات و چین خدمات را پایدار نگه می‌دارد.",
        "textarea",
        None,
        9,
    ),
    ("about.stat4_value", "about", "آمار ۴ — عدد", "۲۴/۷", "text", "آمار اضافه در صفحه درباره ما", 16),
    ("about.stat4_label", "about", "آمار ۴ — عنوان", "پشتیبانی حواله", "text", None, 17),
    ("home.badge", "home", "برچسب بالای عنوان", "نرخ لحظه‌ای اسعار", "text", None, 0),
    ("home.hero_title", "home", "عنوان اصلی", "حواله و تبادل ارز", "text", None, 1),
    ("home.hero_title_accent", "home", "عنوان طلایی", "با اطمینان", "text", "بخش رنگی عنوان صفحه اصلی", 2),
    (
        "home.hero_description",
        "home",
        "توضیح صفحه اصلی",
        "نرخ لحظه‌ای اسعار، حواله یوان به چین، شارژ علی‌پی و وی‌چت‌پی و خدمات بازرگانی با شبکه نمایندگی‌های مطمئن.",
        "textarea",
        None,
        3,
    ),
    ("home.cta_primary", "home", "دکمه اصلی", "ثبت درخواست حواله", "text", None, 4),
    ("home.cta_secondary", "home", "دکمه دوم", "مشاهده نرخ لحظه‌ای", "text", None, 5),
    (
        "home.live_rates_notice",
        "home",
        "اعلامیه نرخ زنده",
        "نرخ‌ها به‌صورت زنده بروزرسانی می‌شوند",
        "text",
        "در صفحه اصلی قبل از بخش خدمات نمایش داده می‌شود",
        6,
    ),
    (
        "home.stat1_label",
        "home",
        "برچسب سال تجربه",
        "سال تجربه",
        "text",
        "عدد از سال شروع فعالیت محاسبه می‌شود",
        8,
    ),
    (
        "home.stat2_label",
        "home",
        "برچسب نمایندگی فعال",
        "نمایندگی فعال",
        "text",
        "عدد از تعداد نمایندگی‌ها محاسبه می‌شود",
        10,
    ),
    (
        "home.stat3_label",
        "home",
        "برچسب ارز قابل معامله",
        "ارز قابل معامله",
        "text",
        "عدد از ارزهای فعال محاسبه می‌شود",
        12,
    ),
    ("home.services_title", "home", "عنوان بخش خدمات", "خدمات صرافی", "text", None, 13),
    (
        "home.services_description",
        "home",
        "توضیح بخش خدمات",
        "حواله یوان به چین، شارژ علی‌پی و وی‌چت‌پی، تبادل اسعار و خدمات بازرگانی.",
        "textarea",
        None,
        14,
    ),
    (
        "home.why_title",
        "home",
        "عنوان بخش چرا ما",
        "اعتماد، سرعت و نرخ شفاف",
        "text",
        "عنوان بخش چرا صرافی سروری",
        15,
    ),
    ("home.adv1_title", "home", "مزیت ۱ — عنوان", "سرعت انتقال", "text", None, 16),
    (
        "home.adv1_text",
        "home",
        "مزیت ۱ — متن",
        "حواله‌ها پس از تایید، در کوتاه‌ترین زمان به مقصد می‌رسند.",
        "textarea",
        None,
        17,
    ),
    ("home.adv2_title", "home", "مزیت ۲ — عنوان", "امنیت و اعتماد", "text", None, 18),
    (
        "home.adv2_text",
        "home",
        "مزیت ۲ — متن",
        "هر درخواست در سیستم ثبت می‌شود و وضعیت آن قابل پیگیری است.",
        "textarea",
        None,
        19,
    ),
    ("home.adv3_title", "home", "مزیت ۳ — عنوان", "نرخ رقابتی", "text", None, 20),
    (
        "home.adv3_text",
        "home",
        "مزیت ۳ — متن",
        "نرخ خرید و فروش بر اساس بازار روز و با کارمزد شفاف اعلام می‌شود.",
        "textarea",
        None,
        21,
    ),
    ("home.adv4_title", "home", "مزیت ۴ — عنوان", "شبکه بین‌المللی", "text", None, 22),
    (
        "home.adv4_text",
        "home",
        "مزیت ۴ — متن",
        "نمایندگی‌ها در افغانستان، امارات و چین پوشش حواله را کامل می‌کنند.",
        "textarea",
        None,
        23,
    ),
    ("home.articles_title", "home", "عنوان بخش مقالات", "راهنما و اخبار بازار ارز", "text", None, 24),
    ("home.services_eyebrow", "home", "برچسب بخش خدمات", "خدمات ما", "text", None, 25),
    ("home.why_eyebrow", "home", "برچسب بخش چرا ما", "چرا صرافی سروری؟", "text", None, 26),
    ("home.articles_eyebrow", "home", "برچسب بخش مقالات", "مقالات", "text", None, 27),
    (
        "home.rates_full_link",
        "home",
        "لینک جدول نرخ در مبدل",
        "جدول کامل نرخ برابری اسعار",
        "text",
        None,
        28,
    ),
    (
        "home.rates_table_link",
        "home",
        "لینک جدول کامل نرخ‌ها",
        "مشاهده جدول کامل نرخ‌ها",
        "text",
        None,
        29,
    ),
    ("home.articles_all_link", "home", "لینک همه مقالات", "همه مقالات", "text", None, 30),
    ("services.hero_title", "services", "عنوان صفحه خدمات", "خدمات صرافی", "text", None, 0),
    (
        "services.hero_description",
        "services",
        "توضیح صفحه خدمات",
        "حواله یوان به چین، شارژ علی‌پی و وی‌چت‌پی، تبادل اسعار، حواله بین‌المللی و خدمات بازرگانی.",
        "textarea",
        None,
        1,
    ),
    (
        "services.cta_title",
        "services",
        "عنوان دعوت به حواله",
        "آماده ثبت اولین حواله خود هستید؟",
        "text",
        None,
        2,
    ),
    (
        "services.cta_text",
        "services",
        "متن دعوت به حواله",
        "درخواست خود را ثبت کنید تا کارشناسان نرخ و زمان انتقال را اعلام کنند.",
        "textarea",
        None,
        3,
    ),
    ("rates.hero_title", "rates", "عنوان صفحه نرخ‌ها", "نرخ لحظه‌ای برابری اسعار", "text", None, 0),
    (
        "rates.hero_description",
        "rates",
        "توضیح صفحه نرخ‌ها",
        "نرخ‌های زیر بر مبنای افغانی (AFN) محاسبه شده‌اند.",
        "textarea",
        None,
        1,
    ),
    (
        "rates.notice",
        "rates",
        "اعلامیه صفحه نرخ‌ها",
        "نرخ‌ها به‌صورت زنده بروزرسانی می‌شوند و ممکن است در لحظه معامله اندکی تفاوت داشته باشند.",
        "textarea",
        None,
        2,
    ),
    (
        "branches.hero_title",
        "branches",
        "عنوان صفحه نمایندگی‌ها",
        "شبکه دفاتر و نمایندگی‌ها",
        "text",
        None,
        0,
    ),
    (
        "branches.hero_description",
        "branches",
        "توضیح صفحه نمایندگی‌ها",
        "نشانی، شماره تماس و واتس‌اپ دفتر مرکزی و نمایندگی‌های ما در افغانستان و امارات.",
        "textarea",
        None,
        1,
    ),
    (
        "contact.hero_description",
        "contact",
        "توضیح صفحه تماس",
        "شماره تماس، واتس‌اپ، ایمیل و نشانی دفتر مرکزی برای دریافت نرخ حواله و مشاوره.",
        "textarea",
        None,
        0,
    ),
]


def _seed_currencies(db: Session) -> int:
    created = 0
    for code, name_fa, flag, buy, sell, sort_order in CURRENCIES:
        exists = db.scalar(select(Currency.id).where(Currency.code == code))
        if exists:
            continue
        db.add(
            Currency(
                code=code,
                name_fa=name_fa,
                flag=flag,
                buy_rate=buy,
                sell_rate=sell,
                sort_order=sort_order,
                is_active=True,
            )
        )
        created += 1
    return created


def _seed_services(db: Session) -> int:
    created = 0
    for slug, title_fa, summary_fa, icon, sort_order in SERVICES:
        exists = db.scalar(select(Service.id).where(Service.slug == slug))
        if exists:
            continue
        db.add(
            Service(
                slug=slug,
                title_fa=title_fa,
                summary_fa=summary_fa,
                icon=icon,
                sort_order=sort_order,
                is_active=True,
            )
        )
        created += 1
    return created


def _seed_branches(db: Session) -> int:
    created = 0
    for name_fa, city_fa, country_fa, address_fa, phone, whatsapp, sort_order in BRANCHES:
        exists = db.scalar(
            select(Branch.id).where(Branch.name_fa == name_fa, Branch.city_fa == city_fa)
        )
        if exists:
            continue
        db.add(
            Branch(
                name_fa=name_fa,
                city_fa=city_fa,
                country_fa=country_fa,
                address_fa=address_fa,
                phone=phone,
                whatsapp=whatsapp,
                sort_order=sort_order,
            )
        )
        created += 1
    return created


def _seed_articles(db: Session) -> int:
    created = 0
    for slug, title_fa, excerpt_fa, body_fa in ARTICLES:
        exists = db.scalar(select(Article.id).where(Article.slug == slug))
        if exists:
            continue
        db.add(
            Article(
                slug=slug,
                title_fa=title_fa,
                excerpt_fa=excerpt_fa,
                body_fa=f"<p>{body_fa}</p>",
                is_published=True,
            )
        )
        created += 1
    return created


OBSOLETE_SETTING_KEYS = (
    "home.stat1_value",
    "home.stat2_value",
    "home.stat3_value",
    "about.stat1_value",
    "about.stat1_label",
    "about.stat2_value",
    "about.stat2_label",
    "about.stat3_value",
    "about.stat3_label",
)


def _remove_obsolete_settings(db: Session) -> int:
    removed = 0
    for key in OBSOLETE_SETTING_KEYS:
        row = db.get(SiteSetting, key)
        if not row:
            continue
        db.delete(row)
        removed += 1
    return removed


def _seed_settings(db: Session) -> int:
    created = 0
    for key, group_key, label_fa, value, input_kind, hint_fa, sort_order in SITE_SETTINGS:
        exists = db.get(SiteSetting, key)
        if exists:
            continue
        db.add(
            SiteSetting(
                key=key,
                group_key=group_key,
                label_fa=label_fa,
                value=value,
                input_kind=input_kind,
                hint_fa=hint_fa,
                sort_order=sort_order,
            )
        )
        created += 1
    return created


FAQS = [
    (
        "کارمزد حواله چقدر است؟",
        "کارمزد بسته به مقصد، ارز و مبلغ اعلام می‌شود. پس از ثبت درخواست، کارشناس هزینه دقیق را به شما می‌گوید.",
        "کارمزد، کمیسیون، هزینه",
        1,
    ),
    (
        "چه مدارکی برای حواله لازم است؟",
        "معمولاً مشخصات کامل فرستنده و گیرنده کافی است. برای مبالغ بالاتر ممکن است مدارک شناسایی خواسته شود.",
        "مدارک، شناسنامه، پاسپورت",
        2,
    ),
    (
        "حواله چقدر طول می‌کشد؟",
        "زمان رسیدن حواله به مقصد و نوع انتقال بستگی دارد. پس از بررسی درخواست، زمان تقریبی اعلام می‌شود.",
        "زمان، مدت، رسیدن",
        3,
    ),
]


def _seed_faqs(db: Session) -> int:
    created = 0
    for question, answer, keywords, sort_order in FAQS:
        exists = db.scalar(select(Faq.id).where(Faq.question == question))
        if exists:
            continue
        db.add(
            Faq(
                question=question,
                answer=answer,
                keywords=keywords,
                sort_order=sort_order,
                is_active=True,
            )
        )
        created += 1
    return created


def _seed_admin(db: Session) -> bool:
    email = settings.SEED_ADMIN_EMAIL.lower().strip()
    user = db.scalar(select(User).where(User.email == email))
    if user:
        if not user.has_role(AppRole.ADMIN):
            db.add(UserRole(user_id=user.id, role=AppRole.ADMIN))
        return False

    user = User(
        email=email,
        password_hash=hash_password(settings.SEED_ADMIN_PASSWORD),
        full_name="مدیر سیستم",
        is_active=True,
    )
    db.add(user)
    db.flush()
    db.add(UserRole(user_id=user.id, role=AppRole.ADMIN))
    return True


def run_seed(db: Session | None = None) -> dict:
    owns_session = db is None
    session = db or SessionLocal()
    try:
        result = {
            "currencies": _seed_currencies(session),
            "services": _seed_services(session),
            "branches": _seed_branches(session),
            "articles": _seed_articles(session),
            "settings": _seed_settings(session),
            "settings_removed": _remove_obsolete_settings(session),
            "faqs": _seed_faqs(session),
            "admin_created": _seed_admin(session),
        }
        session.commit()
        return result
    except Exception:
        session.rollback()
        raise
    finally:
        if owns_session:
            session.close()


def main() -> None:
    result = run_seed()
    print("Seed complete:", result)


if __name__ == "__main__":
    main()
