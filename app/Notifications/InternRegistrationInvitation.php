<?php

namespace App\Notifications;

use App\Models\Intern;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InternRegistrationInvitation extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Intern $intern,
        private readonly string $url,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $internName = trim($this->intern->name.' '.$this->intern->last_name);

        return (new MailMessage)
            ->subject('Completa tu acceso a Gestion Becarios')
            ->greeting('Hola '.$internName)
            ->line('Tu perfil de practicas ya esta registrado en el sistema.')
            ->line('Pulsa el boton para crear tu contrasena y poder acceder a tu panel.')
            ->action('Crear mi contrasena', $this->url)
            ->line('Si no esperabas este correo, puedes ignorarlo.');
    }
}
