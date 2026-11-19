print("welcome to the banking system, what is your choice?\n")
balance = 20000
def check_balance(balance:int)-> str:
    return f"your balance is £{balance}"

def deposit(amount: int, balance : int) -> str:
    balance += amount
    return f"depositied £{amount}, new balance £{balance}"

def withdraw(amount: int, balance :int) -> str:
    balance -= amount
    return f"withdrawn £{amount}, new balance £{balance}"

while True:
    print("1:balance")
    print("2:deposit cash")
    print("3:withdraw balance")
    print("4:Exit")
    choice = int(input("enter choice : "))
    if choice == 1:
        print(check_balance(balance))
        try_again = int(input('Would you like to perform another transaction?\n1 for Yes\n2 for No: '))
        if  try_again == 2:
            break
    elif choice == 2:
        amount = int(input("enter you amount you wish to deposit"))
        print(deposit(amount,balance))
        try_again = int(input('Would you like to perform another transaction?\n1 for Yes\n2 for No: '))
        if  try_again == 2:
            break
    elif choice == 3:
        amount = int(input("enter the amount you wish to withdraw"))
        if amount < balance:     
            print(withdraw(amount,balance))
        else:
            print('Insufficient Funds')
        try_again = int(input('Would you like to perform another transaction?\n1 for Yes\n2 for No: '))
        if  try_again == 2:
            break
        
    elif choice == 4:
        break
        