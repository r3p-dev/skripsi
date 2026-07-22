/*
|--------------------------------------------------------------------------
| Validator file
|--------------------------------------------------------------------------
|
| The validator file is used for configuring global transforms for VineJS.
| The transform below converts all VineJS date outputs from JavaScript
| Date objects to Luxon DateTime instances, so that validated dates are
| ready to use with Lucid models and other parts of the app that expect
| Luxon DateTime.
|
*/

import { DateTime } from 'luxon'
import vine, { VineDate, SimpleMessagesProvider } from '@vinejs/vine'

vine.messagesProvider = new SimpleMessagesProvider(
  {
    'required': '{{ field }} wajib diisi',
    'string': '{{ field }} harus berupa teks',
    'alpha': '{{ field }} hanya boleh berisi huruf',
    'alphaNumeric': '{{ field }} hanya boleh berisi huruf dan angka',
    'minLength': '{{ field }} minimal {{ min }} karakter',
    'maxLength': '{{ field }} maksimal {{ max }} karakter',
    'fixedLength': '{{ field }} harus terdiri dari {{ size }} karakter',
    'mobile': '{{ field }} harus berupa nomor HP yang valid',
    'regex': '{{ field }} memiliki format yang tidak valid',
    'phone.regex': '{{ field }} harus berupa nomor HP Indonesia yang valid',
    'password.regex': '{{ field }} harus berisi huruf serta angka',
    'confirmed': '{{ field }} tidak cocok',
    'boolean': '{{ field }} harus berupa nilai benar atau salah',
    'date': '{{ field }} harus berupa tanggal yang valid',
    'enum': '{{ field }} yang dipilih tidak valid',
    'number': '{{ field }} harus berupa angka',
    'min': '{{ field }} minimal {{ min }}',
    'max': '{{ field }} maksimal {{ max }}',
    'positive': '{{ field }} harus bernilai positif',
    'range': '{{ field }} harus di antara {{ min }} sampai {{ max }}',
    'object': '{{ field }} harus berupa objek',
    'array': '{{ field }} harus berupa daftar',
    'array.minLength': '{{ field }} minimal berisi {{ min }} item',
    'array.maxLength': '{{ field }} maksimal {{ max }} item',
    'array.fixedLength': '{{ field }} harus berisi {{ size }} item',
    'notEmpty': '{{ field }} tidak boleh kosong',
    'distinct': '{{ field }} tidak boleh berisi data yang sama',
    'date.equals': '{{ field }} harus sama dengan tanggal {{ expectedValue }}',
    'date.after': '{{ field }} harus setelah {{ expectedValue }}',
    'date.before': '{{ field }} harus sebelum {{ expectedValue }}',
    'date.afterOrEqual': '{{ field }} harus setelah atau sama dengan {{ expectedValue }}',
    'date.beforeOrEqual': '{{ field }} harus sebelum atau sama dengan {{ expectedValue }}',
    'date.sameAs': '{{ field }} harus sama dengan {{ otherField }}',
    'date.notSameAs': '{{ field }} tidak boleh sama dengan {{ otherField }}',
    'date.afterField': '{{ field }} harus setelah {{ otherField }}',
    'date.afterOrSameAs': '{{ field }} harus setelah atau sama dengan {{ otherField }}',
    'date.beforeField': '{{ field }} harus sebelum {{ otherField }}',
    'date.beforeOrSameAs': '{{ field }} harus sebelum atau sama dengan {{ otherField }}',
    'date.weekend': '{{ field }} bukan hari akhir pekan',
    'date.weekday': '{{ field }} bukan hari kerja',
    'database.unique': '{{ field }} sudah digunakan',
    'current_password': 'Kata sandi saat ini salah',
  },
  {
    name: 'Nama Lengkap',
    phone: 'Nomor Telepon',
    password: 'Kata sandi',
    password_confirmation: 'Konfirmasi kata sandi',
    current_password: 'Kata sandi saat ini',
    new_password: 'Kata sandi baru',
    new_password_confirmation: 'Konfirmasi kata sandi baru',
    street: 'Alamat',
    latitude: 'Latitude',
    longitude: 'Longitude',
    note: 'Catatan',
    date: 'Tanggal',
  }
)

VineDate.transform((value) => DateTime.fromJSDate(value))

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}
