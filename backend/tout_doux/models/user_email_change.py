from django.db import models

from tout_doux.models.user import UserRelatedModel
from tout_doux.utils.date import now_plus_one_week


class UserEmailChange(UserRelatedModel):
    new_email = models.EmailField(max_length=100)
    token = models.CharField(max_length=64, primary_key=True)
    expiry_date = models.DateTimeField(editable=False, default=now_plus_one_week)

    class Meta:
        db_table = 'tout_doux_user_email_change'
