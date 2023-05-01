from datetime import timedelta


# Return an iterator though the start_date and end_date
def daterange(start_date, end_date):
    operator = 1 if start_date < end_date else -1

    for n in range(abs((end_date - start_date).days) + 1):
        yield start_date + (timedelta(n) * operator)
