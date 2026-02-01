FROM cloudflare/cloudflared:latest

# Use shell entrypoint for flexibility
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
