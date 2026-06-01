"""Seed the database with realistic dummy data. Run: python -m app.scripts.seed"""
import asyncio
from datetime import date, timedelta
import random
from decimal import Decimal
from sqlalchemy import select
from app.database import async_session_maker
from app.models.user import User
from app.models.machine import Machine
from app.models.labour import Labour
from app.models.shift import Shift
from app.models.advance import Advance
from app.models.client import Client
from app.models.order import Order
from app.models.raw_material import RawMaterial, MaterialUsage
from app.models.expense import DailyExpense, MaintenanceLog
from app.auth.jwt import get_password_hash

today = date.today()


def days_ago(n):
    return today - timedelta(days=n)


async def main():
    async with async_session_maker() as db:
        # ── Users ────────────────────────────────────────────────────────────
        manager = User(name="Usman Tariq", email="manager@embroidery.com",
                       hashed_password=get_password_hash("Manager@123"), role="manager", is_active=True)
        viewer = User(name="Zara Aslam", email="viewer@embroidery.com",
                      hashed_password=get_password_hash("Viewer@123"), role="viewer", is_active=True)
        db.add_all([manager, viewer])
        await db.flush()

        # ── Machines ─────────────────────────────────────────────────────────
        machines = [
            Machine(name="Tajima M-1",  model_number="TMEF-H1506",  status="active",    purchase_date=days_ago(730), notes="6-head machine, main production"),
            Machine(name="Tajima M-2",  model_number="TMEF-H1506",  status="active",    purchase_date=days_ago(540), notes="6-head machine"),
            Machine(name="Brother BAS", model_number="BAS-311E",    status="active",    purchase_date=days_ago(400), notes="Single-head, fine detail work"),
            Machine(name="ZSK Sprint",  model_number="SPRINT6",     status="idle",      purchase_date=days_ago(900), notes="Older unit — standby"),
            Machine(name="Barudan BEKT",model_number="BEKT-S1506C", status="maintenance", purchase_date=days_ago(1200), notes="Under repair"),
        ]
        db.add_all(machines)
        await db.flush()

        # ── Labour ───────────────────────────────────────────────────────────
        labours = [
            Labour(name="Ali Hassan",    phone="0300-1234567", cnic="35202-1234567-1", monthly_salary=Decimal("28000"), joining_date=days_ago(600), status="active"),
            Labour(name="Raza Ahmed",    phone="0311-9876543", cnic="35202-9876543-2", monthly_salary=Decimal("25000"), joining_date=days_ago(480), status="active"),
            Labour(name="Imran Khan",    phone="0333-5554433", cnic="35202-5554433-3", monthly_salary=Decimal("30000"), joining_date=days_ago(365), status="active"),
            Labour(name="Bilal Akhtar",  phone="0321-1112233", cnic="35202-1112233-4", monthly_salary=Decimal("22000"), joining_date=days_ago(200), status="active"),
            Labour(name="Kashif Mehmood",phone="0345-6667788", cnic="35202-6667788-5", monthly_salary=Decimal("26000"), joining_date=days_ago(90),  status="active"),
            Labour(name="Shahid Nawaz",  phone="0301-2223344", cnic="35202-2223344-6", monthly_salary=Decimal("20000"), joining_date=days_ago(730), status="inactive"),
        ]
        db.add_all(labours)
        await db.flush()

        # ── Advances ─────────────────────────────────────────────────────────
        active_labours = [l for l in labours if l.status == "active"]
        advances = []
        for labour in active_labours[:4]:
            for offset in [25, 10]:
                adv_date = days_ago(offset)
                if adv_date.month == today.month:
                    advances.append(Advance(labour_id=labour.id, amount=Decimal(random.choice([3000, 5000, 7000])),
                                            date=adv_date, notes="Advance on request"))
        db.add_all(advances)
        await db.flush()

        # ── Clients ──────────────────────────────────────────────────────────
        clients = [
            Client(name="Ahmed Textiles",      phone="042-3456789", company_name="Ahmed Textiles Pvt Ltd",  address="Lahore, Punjab",      notes="Premium client — bulk orders"),
            Client(name="Faisal Garments",     phone="021-7654321", company_name="Faisal Garments",         address="Karachi, Sindh",       notes="Regular monthly orders"),
            Client(name="Sana Embroidery Co",  phone="051-1234567", company_name="Sana Embroidery Co",      address="Rawalpindi, Punjab",   notes="Custom designs"),
            Client(name="Noor Fashion House",  phone="041-9988776", company_name="Noor Fashion House",      address="Faisalabad, Punjab",   notes="Seasonal bulk"),
            Client(name="Karachi Crafts",      phone="021-3344556", company_name="Karachi Crafts Ltd",      address="Karachi, Sindh",       notes="Small but steady"),
            Client(name="Capital Uniforms",    phone="051-6677889", company_name="Capital Uniforms",        address="Islamabad",            notes="Corporate uniforms"),
        ]
        db.add_all(clients)
        await db.flush()

        # ── Orders ───────────────────────────────────────────────────────────
        active_machines = [m for m in machines if m.status == "active"]
        order_data = [
            # (client_idx, machine_idx, design, type, est_stitches, actual, rate, total, advance, status, order_date_offset, deadline_offset)
            (0, 0, "Floral Paisley Dupatta", "fixed_stitches", 45000, 45000, Decimal("0.0012"), Decimal("54.00"),   Decimal("20000"),  "delivered",   90, 60),
            (1, 1, "Corporate Logo Polo",    "fixed_stitches", 12000, 12000, Decimal("0.0015"), Decimal("18.00"),   Decimal("8000"),   "delivered",   75, 50),
            (0, 0, "Wedding Shawl Set",      "estimated",       80000, 78500, None,              Decimal("110000"), Decimal("40000"),  "completed",   60, 30),
            (2, 2, "School Uniform Crest",   "fixed_stitches",  8000,  8000, Decimal("0.002"),  Decimal("16.00"),   Decimal("5000"),   "completed",   55, 25),
            (3, 1, "Silk Kurta Motifs",      "estimated",       60000, None,  None,              Decimal("85000"),  Decimal("30000"),  "in_progress", 30, 15),
            (4, 0, "Sports Jersey Logo",     "fixed_stitches",  5000, None,  Decimal("0.0018"), None,               Decimal("3000"),   "in_progress", 20, 5),
            (5, 2, "Office Shirt Monogram",  "fixed_stitches",  3000, None,  Decimal("0.002"),  None,               Decimal("2000"),   "in_progress", 15, 10),
            (1, 1, "Bridal Lehenga Border",  "estimated",      120000, None,  None,              Decimal("180000"), Decimal("60000"),  "pending",     10, 20),
            (2, 0, "Kids Frock Print",       "fixed_stitches",  6000, None,  Decimal("0.0016"), None,               Decimal("2500"),   "pending",      5, 25),
            (0, 1, "Table Runner Set x50",   "fixed_stitches", 15000, None,  Decimal("0.0014"), None,               Decimal("5000"),   "pending",      2, 30),
        ]
        orders = []
        for c_i, m_i, design, otype, est, actual, rate, total, advance, status, od_off, dl_off in order_data:
            o = Order(
                client_id=clients[c_i].id,
                machine_id=active_machines[m_i].id,
                design_name=design,
                order_type=otype,
                estimated_stitches=est,
                actual_stitches=actual,
                rate_per_stitch=rate,
                total_amount=total,
                advance_payment=advance,
                status=status,
                order_date=days_ago(od_off),
                deadline=days_ago(-dl_off),
                notes=None,
            )
            orders.append(o)
        db.add_all(orders)
        await db.flush()

        # ── Shifts (last 45 days) ─────────────────────────────────────────────
        shift_pairs = [
            (active_machines[0], active_labours[0]),
            (active_machines[0], active_labours[1]),
            (active_machines[1], active_labours[2]),
            (active_machines[1], active_labours[3]),
            (active_machines[2], active_labours[4]),
        ]
        shifts = []
        for day_offset in range(45, 0, -1):
            shift_date = days_ago(day_offset)
            if shift_date.weekday() == 6:   # skip Sundays
                continue
            for machine, labour in shift_pairs:
                if machine.status != "active":
                    continue
                count = random.randint(18000, 42000)
                stype = "day" if random.random() > 0.3 else "night"
                shifts.append(Shift(machine_id=machine.id, labour_id=labour.id,
                                    date=shift_date, shift_type=stype, stitch_count=count))
        db.add_all(shifts)
        await db.flush()

        # ── Raw Materials ─────────────────────────────────────────────────────
        materials = [
            RawMaterial(name="Polyester Thread (White)", unit="kg",      current_stock=Decimal("45.5"),  cost_per_unit=Decimal("850"),  minimum_stock_alert=Decimal("10")),
            RawMaterial(name="Polyester Thread (Black)", unit="kg",      current_stock=Decimal("38.0"),  cost_per_unit=Decimal("850"),  minimum_stock_alert=Decimal("10")),
            RawMaterial(name="Colour Thread Set",        unit="set",     current_stock=Decimal("12"),    cost_per_unit=Decimal("3500"), minimum_stock_alert=Decimal("3")),
            RawMaterial(name="Backing Fabric",           unit="meters",  current_stock=Decimal("8.5"),   cost_per_unit=Decimal("120"),  minimum_stock_alert=Decimal("20")),
            RawMaterial(name="Stabilizer (Cut-Away)",    unit="meters",  current_stock=Decimal("150"),   cost_per_unit=Decimal("45"),   minimum_stock_alert=Decimal("30")),
            RawMaterial(name="Bobbin Thread",            unit="kg",      current_stock=Decimal("2.1"),   cost_per_unit=Decimal("600"),  minimum_stock_alert=Decimal("5")),
            RawMaterial(name="Machine Needles (Pack)",   unit="pcs",     current_stock=Decimal("24"),    cost_per_unit=Decimal("250"),  minimum_stock_alert=Decimal("10")),
            RawMaterial(name="Embroidery Foam",          unit="meters",  current_stock=Decimal("3.0"),   cost_per_unit=Decimal("80"),   minimum_stock_alert=Decimal("10")),
        ]
        db.add_all(materials)
        await db.flush()

        # ── Material Usages ───────────────────────────────────────────────────
        completed_orders = [o for o in orders if o.status in ("completed", "delivered")]
        usages = []
        for order in completed_orders:
            usages.append(MaterialUsage(order_id=order.id, material_id=materials[0].id,
                                        quantity_used=Decimal(str(round(random.uniform(0.5, 3.0), 2))),
                                        date=order.order_date + timedelta(days=3)))
            usages.append(MaterialUsage(order_id=order.id, material_id=materials[4].id,
                                        quantity_used=Decimal(str(round(random.uniform(5, 20), 1))),
                                        date=order.order_date + timedelta(days=3)))
        db.add_all(usages)
        await db.flush()

        # ── Daily Expenses (last 60 days) ────────────────────────────────────
        expense_templates = [
            ("electricity", [8000, 9500, 10000, 7500]),
            ("rent",        [45000]),
            ("transport",   [1500, 2000, 2500, 1800]),
            ("misc",        [500, 800, 1200, 600, 300]),
        ]
        expenses = []
        for day_offset in range(60, 0, -1):
            exp_date = days_ago(day_offset)
            # Electricity weekly
            if day_offset % 7 == 0:
                expenses.append(DailyExpense(category="electricity", amount=Decimal(str(random.choice([8000, 9500, 10000]))), date=exp_date, description="LESCO bill payment"))
            # Rent on 1st
            if exp_date.day == 1:
                expenses.append(DailyExpense(category="rent", amount=Decimal("45000"), date=exp_date, description="Monthly factory rent"))
            # Transport 3x/week
            if day_offset % 3 == 0:
                expenses.append(DailyExpense(category="transport", amount=Decimal(str(random.choice([1500, 2000, 2500]))), date=exp_date, description="Material pickup / delivery"))
            # Misc randomly
            if random.random() < 0.2:
                expenses.append(DailyExpense(category="misc", amount=Decimal(str(random.choice([400, 600, 900, 1100]))), date=exp_date, description=random.choice(["Cleaning supplies", "Tea & refreshments", "Stationery", "Small tools"])))
        db.add_all(expenses)
        await db.flush()

        # ── Maintenance Logs ──────────────────────────────────────────────────
        logs = [
            MaintenanceLog(machine_id=machines[0].id, date=days_ago(60), cost=Decimal("3500"), description="Needle bar lubrication and hook timing adjustment", type="routine"),
            MaintenanceLog(machine_id=machines[1].id, date=days_ago(45), cost=Decimal("1200"), description="Thread tension calibration", type="routine"),
            MaintenanceLog(machine_id=machines[2].id, date=days_ago(30), cost=Decimal("8500"), description="Motor replacement — bearing failure", type="breakdown"),
            MaintenanceLog(machine_id=machines[3].id, date=days_ago(20), cost=Decimal("2000"), description="Full cleaning and oiling", type="routine"),
            MaintenanceLog(machine_id=machines[4].id, date=days_ago(15), cost=Decimal("22000"), description="Control board repair", type="breakdown"),
            MaintenanceLog(machine_id=machines[4].id, date=days_ago(5),  cost=Decimal("15000"), description="Software upgrade + head alignment", type="upgrade"),
            MaintenanceLog(machine_id=machines[0].id, date=days_ago(10), cost=Decimal("0"),     description="Routine inspection — all clear", type="routine"),
        ]
        db.add_all(logs)
        await db.flush()

        await db.commit()

        print("✅ Seed complete!")
        print(f"   Users       : {2} added  (manager@embroidery.com / Manager@123)")
        print(f"   Machines    : {len(machines)}")
        print(f"   Labour      : {len(labours)}")
        print(f"   Advances    : {len(advances)}")
        print(f"   Clients     : {len(clients)}")
        print(f"   Orders      : {len(orders)}")
        print(f"   Shifts      : {len(shifts)}")
        print(f"   Materials   : {len(materials)}")
        print(f"   Expenses    : {len(expenses)}")
        print(f"   Maint. Logs : {len(logs)}")


if __name__ == "__main__":
    asyncio.run(main())
