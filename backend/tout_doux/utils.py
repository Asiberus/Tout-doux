def get_or_none(model, **kwargs):
    try:
        return model.objects.get(**kwargs)
    except model.DoesNotExist:
        return None


def get_or_raise_error(model, error, **kwargs):
    try:
        return model.objects.get(**kwargs)
    except model.DoesNotExist:
        raise error
