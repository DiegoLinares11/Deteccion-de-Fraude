from faker import Faker
import pandas as pd
import random
from datetime import datetime, timedelta

fake = Faker('es_ES')  # Datos en español (opcional)
random.seed(42)  # Para reproducibilidad

# --------------------------
# Configuración General
# --------------------------
NUM_CUSTOMERS = 2000
NUM_ACCOUNTS = 2000
NUM_DEVICES = 500
NUM_LOCATIONS = 300
NUM_BRANCHES = 100

# --------------------------
# Generación de Nodos
# --------------------------

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


# ... (Generar otras relaciones como USES, LOCATED_AT, etc.)

# --------------------------
# Exportar a CSV
# --------------------------
df_customers.to_csv('csv/customers.csv', index=False)
df_accounts.to_csv('csv/accounts.csv', index=False)
df_transfers.to_csv('csv/transfers.csv', index=False)
# ... Exportar demás CSV