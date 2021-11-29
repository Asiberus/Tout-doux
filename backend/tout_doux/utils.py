import datetime


def get_or_raise_error(model, error, **kwargs):
    try:
        return model.objects.get(**kwargs)
    except model.DoesNotExist:
        raise error


# Return a iterator though the start_date and end_date
# Inclusive mode is set by adding one day to the end_date
def daterange(start_date, end_date, inclusive=True, reverse=False):
    if inclusive and not reverse:
        end_date += datetime.timedelta(1)

    for n in range(int((end_date - start_date).days)):
        if reverse:
            yield end_date - datetime.timedelta(n)
        else:
            yield start_date + datetime.timedelta(n)
