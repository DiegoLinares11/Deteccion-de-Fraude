from faker import Faker
import pandas as pd
import random
from datetime import datetime, timedelta

fake = Faker('es_ES')  
random.seed(42)  # Para reproducibilidad


NUM_CUSTOMERS = 2000
NUM_ACCOUNTS = 2000
NUM_DEVICES = 500
NUM_LOCATIONS = 300
NUM_BRANCHES = 100

# 1. Nodos: Customer
customers = []
for _ in range(NUM_CUSTOMERS):
    customers.append({
        "customerId": fake.uuid4(),
        "firstName": fake.first_name(),
        "lastName": fake.last_name(),
        "email": fake.email(),
        "phoneNumbers": [fake.phone_number() for _ in range(random.randint(1, 3))],
        "isHighRisk": random.choice([True, False]),  # Etiqueta adicional
        "isVIP": random.choice([True, False])        # Etiqueta adicional
    })
df_customers = pd.DataFrame(customers)

# 2. Nodos: Account
accounts = []
for _ in range(NUM_ACCOUNTS):
    accounts.append({
        "accountNumber": fake.iban(),
        "accountType": random.choice(["Savings", "Checking", "Corporate"]),
        "balance": round(random.uniform(1000, 100000), 2),
        "createdAt": fake.date_between(start_date='-5y', end_date='today'),
        "isActive": random.choice([True, False]),
        "currency": random.choice(["USD", "EUR", "GTQ"])
    })
df_accounts = pd.DataFrame(accounts)

# 3. Nodos: Device
devices = []
for _ in range(NUM_DEVICES):
    devices.append({
        "deviceId": fake.uuid4(),
        "deviceType": random.choice(["Mobile", "Desktop", "Tablet"]),
        "os": random.choice(["Android", "iOS", "Windows"]),
        "lastUsed": fake.date_this_year(),
        "ipAddresses": [fake.ipv4() for _ in range(random.randint(1, 2))]
    })
df_devices = pd.DataFrame(devices)

# ... (Generar Location, Branch de manera similar)

# --------------------------
# Generación de Relaciones
# --------------------------

# 1. Relación: OWNS (Customer → Account)
owns = []
for _ in range(NUM_ACCOUNTS):
    owns.append({
        "customerId": random.choice(df_customers['customerId']),
        "accountNumber": random.choice(df_accounts['accountNumber']),
        "ownershipType": random.choice(["primary", "joint"]),
        "since": fake.date_between(start_date='-3y', end_date='today'),
        "sharePercentage": round(random.uniform(50, 100), 2)
    })
df_owns = pd.DataFrame(owns)

# 2. Relación: TRANSFER (Account → Account)
transfers = []
for _ in range(5000):  # Generar 5000 transacciones
    source = random.choice(df_accounts['accountNumber'].tolist())
    
    # Filtrar cuentas que no sean la misma
    possible_targets = df_accounts[df_accounts['accountNumber'] != source]['accountNumber'].tolist()
    
    # Solo añadir si hay al menos una cuenta válida
    if possible_targets:
        target = random.choice(possible_targets)
        transfers.append({
            "sourceAccount": source,
            "targetAccount": target,
            "amount": round(random.uniform(10, 5000), 2),
            "currency": random.choice(["USD", "EUR", "GTQ"]),
            "transactionDate": fake.date_time_this_year(),
            "isInternational": random.choice([True, False])
        })

df_transfers = pd.DataFrame(transfers)


# 4. Nodos: Location
locations = []
for _ in range(NUM_LOCATIONS):
    coords = [float(fake.latitude()), float(fake.longitude())]
    locations.append({
        "locationId": fake.uuid4(),
        "city": fake.city(),
        "country": fake.country(),
        "coordinates": coords,
        "timezone": fake.timezone()
    })
df_locations = pd.DataFrame(locations)

# 5. Nodos: Branch
branches = []
for _ in range(NUM_BRANCHES):
    branches.append({
        "branchCode": fake.bothify(text='BR-#####'),
        "name": fake.street_name() + " Branch",
        "address": fake.address(),
        "openHours": [fake.time(pattern="%H:%M") for _ in range(2)],  # Ej: ["09:00", "17:00"]
        "establishedYear": random.randint(1990, 2023)
    })
df_branches = pd.DataFrame(branches)

# =====================
# Generación de Relaciones (FALTANTES)
# =====================

# 3. USES (Customer → Device)
uses = []
for _ in range(1500):  # 1500 relaciones de uso
    uses.append({
        "customerId": random.choice(df_customers['customerId']),
        "deviceId": random.choice(df_devices['deviceId']),
        "lastAccessed": fake.date_time_this_year(),
        "ipAddress": fake.ipv4(),
        "deviceType": random.choice(["Mobile", "Desktop"])  # Debe coincidir con deviceType del nodo
    })
df_uses = pd.DataFrame(uses)

# 4. LOCATED_AT (Device → Location)
located_at = []
for device in df_devices['deviceId']:  # Cada dispositivo tiene al menos una ubicación
    located_at.append({
        "deviceId": device,
        "locationId": random.choice(df_locations['locationId']),
        "connectionTime": fake.date_time_this_year(),
        "coordinates": random.choice(df_locations['coordinates']),  # Usar coordenadas existentes
        "accuracy": round(random.uniform(0.1, 5.0), 2)
    })
df_located_at = pd.DataFrame(located_at)

# 5. OPERATES_AT (Account → Branch)
operates_at = []
for account in df_accounts['accountNumber']:
    operates_at.append({
        "accountNumber": account,
        "branchCode": random.choice(df_branches['branchCode']),
        "openHours": random.choice(df_branches['openHours']),  # Heredar de Branch
        "establishedYear": random.choice(df_branches['establishedYear'])
    })
df_operates_at = pd.DataFrame(operates_at)

# 6. LINKED_TO (Account ↔ Account)
linked_to = []
for _ in range(1000):  # 1000 relaciones de vinculación
    account1 = random.choice(df_accounts['accountNumber'])
    # Buscar otra cuenta que no sea la misma y que no esté ya vinculada
    possible_accounts = df_accounts[df_accounts['accountNumber'] != account1]['accountNumber'].tolist()
    if possible_accounts:
        account2 = random.choice(possible_accounts)
        linked_to.append({
            "accountA": account1,
            "accountB": account2,
            "linkageType": random.choice(["sharedDevice", "commonOwner", "suspiciousActivity"]),
            "confidenceScore": round(random.uniform(0.5, 1.0)),  # Score entre 0.5 y 1.0
            "detectedAt": fake.date_this_year()
        })
df_linked_to = pd.DataFrame(linked_to)

# 7. REFERRED (Customer → Customer)
referred = []
for _ in range(800):  # 800 referidos
    referrer = random.choice(df_customers['customerId'])
    referred_customer = random.choice(df_customers[df_customers['customerId'] != referrer]['customerId'].tolist())
    referred.append({
        "referrerId": referrer,
        "referredId": referred_customer,
        "referralCode": fake.bothify(text='REF-#####'),
        "referralDate": fake.date_between(start_date='-2y', end_date='today'),
        "bonusAmount": round(random.uniform(50, 500), 2)
    })
df_referred = pd.DataFrame(referred)

# 8. TRUSTS (Customer → Customer)
trusts = []
for _ in range(700):  # 700 relaciones de confianza
    trustor = random.choice(df_customers['customerId'])
    # Buscar otro cliente que no sea el mismo
    possible_trustees = df_customers[df_customers['customerId'] != trustor]['customerId'].tolist()
    if possible_trustees:
        trustee = random.choice(possible_trustees)
        trusts.append({
            "trustorId": trustor,
            "trusteeId": trustee,
            "trustLevel": random.randint(1, 5),  # Nivel de confianza entre 1-5
            "since": fake.date_between(start_date='-5y', end_date='today'),
            "verificationMethod": random.choice(["biometric", "manual", "document"])
        })
df_trusts = pd.DataFrame(trusts)

# 9. SERVICED_BY (Customer → Branch)
serviced_by = []
for _ in range(1000):  # 1000 relaciones de servicio
    serviced_by.append({
        "customerId": random.choice(df_customers['customerId']),
        "branchCode": random.choice(df_branches['branchCode']),
        "serviceLevel": random.choice(["premium", "standard", "basic"]),
        "since": fake.date_between(start_date='-3y', end_date='today'),
        "feedbackScore": round(random.uniform(1.0, 5.0), 1)  # Puntaje de 1.0 a 5.0
    })
df_serviced_by = pd.DataFrame(serviced_by)

# 10. CONNECTED_VIA (Account → Device)
connected_via = []
for _ in range(2000):  # 2000 conexiones cuenta-dispositivo
    connected_via.append({
        "accountNumber": random.choice(df_accounts['accountNumber']),
        "deviceId": random.choice(df_devices['deviceId']),
        "lastUsed": fake.date_time_this_year(),
        "frequency": random.randint(1, 100),  # Veces que se usó el dispositivo
        "isVerified": random.choice([True, False])
    })
df_connected_via = pd.DataFrame(connected_via)

# 11. RESIDES_IN (Customer → Location)
resides_in = []
for customer in df_customers['customerId']:  # Cada cliente tiene al menos una residencia
    resides_in.append({
        "customerId": customer,
        "locationId": random.choice(df_locations['locationId']),
        "since": fake.date_between(start_date='-10y', end_date='today'),
        "addressType": random.choice(["permanent", "temporal"]),
        "verificationStatus": random.choice([True, False])
    })
df_resides_in = pd.DataFrame(resides_in)

# 12. LOCATED_IN (Branch → Location)
located_in = []
for branch in df_branches['branchCode']:
    located_in.append({
        "branchCode": branch,
        "locationId": random.choice(df_locations['locationId']),
        "branchArea": random.choice(["urban", "rural"]),
        "geoAccuracy": round(random.uniform(0.1, 5.0), 2),
        "registeredAt": fake.date_between(start_date='-20y', end_date='today')
    })
df_located_in = pd.DataFrame(located_in)


# =====================
# Exportar TODOS los CSV
# =====================
# Nodos
df_customers.to_csv('csv/customers.csv', index=False)
df_accounts.to_csv('csv/accounts.csv', index=False)
df_devices.to_csv('csv/devices.csv', index=False)
df_locations.to_csv('csv/locations.csv', index=False)
df_branches.to_csv('csv/branches.csv', index=False)

# Relaciones
df_owns.to_csv('csv/owns.csv', index=False)
df_transfers.to_csv('csv/transfers.csv', index=False)
df_uses.to_csv('csv/uses.csv', index=False)
df_located_at.to_csv('csv/located_at.csv', index=False)
df_operates_at.to_csv('csv/operates_at.csv', index=False)
df_linked_to.to_csv('csv/linked_to.csv', index=False)
df_referred.to_csv('csv/referred.csv', index=False)
df_resides_in.to_csv('csv/resides_in.csv', index=False)
df_located_in.to_csv('csv/located_in.csv', index=False)
df_trusts.to_csv('csv/trusts.csv', index=False)
df_serviced_by.to_csv('csv/serviced_by.csv', index=False)
df_connected_via.to_csv('csv/connected_via.csv', index=False)