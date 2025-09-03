from django.contrib import admin


class CustomerAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "username",
        "email",
        "bio",
        "birth_date",
        "address",
    )
    search_fields = (
        "id",
        "address",
    )
    list_filter = ("birth_date",)
