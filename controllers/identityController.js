const repository = require("../models/contactRepository");

function chooseOldestContact(contacts) {
  return contacts.reduce((oldest, current) =>
    new Date(current.createdAt) < new Date(oldest.createdAt)
      ? current
      : oldest
  );
}

exports.resolveCustomerIdentity = async (req, res) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({
      error: "Either email or phoneNumber must be provided"
    });
  }

  const conn = await repository.getConnection();
  await conn.beginTransaction();

  try {
    const directMatches = await repository.fetchContactsByEmailOrPhone(
      conn,
      email,
      phoneNumber
    );

    if (directMatches.length === 0) {
      const newPrimaryId = await repository.createPrimaryContact(
        conn,
        email,
        phoneNumber
      );

      await conn.commit();

      return res.json({
        contact: {
          primaryContatctId: newPrimaryId,
          emails: email ? [email] : [],
          phoneNumbers: phoneNumber ? [phoneNumber] : [],
          secondaryContactIds: []
        }
      });
    }

    let cluster = [];

    for (const contact of directMatches) {
      const primaryId =
        contact.linkPrecedence === "primary"
          ? contact.id
          : contact.linkedId;

      const group = await repository.fetchGroupByPrimaryId(conn, primaryId);
      cluster.push(...group);
    }

    const uniqueCluster = Array.from(
      new Map(cluster.map(c => [c.id, c])).values()
    );

    const oldestContact = chooseOldestContact(uniqueCluster);
    const primaryId = oldestContact.id;

    for (const contact of uniqueCluster) {
      if (contact.id !== primaryId) {
        await repository.convertToSecondary(conn, contact.id, primaryId);
      }
    }

    const emailExists = uniqueCluster.some(c => c.email === email);
    const phoneExists = uniqueCluster.some(c => c.phoneNumber === phoneNumber);

    if (!emailExists || !phoneExists) {
      await repository.createSecondaryContact(
        conn,
        email,
        phoneNumber,
        primaryId
      );
    }

    const finalContacts = await repository.fetchGroupByPrimaryId(
      conn,
      primaryId
    );

    await conn.commit();

    const emails = [
      ...new Set(finalContacts.map(c => c.email).filter(Boolean))
    ];

    const phoneNumbers = [
      ...new Set(finalContacts.map(c => c.phoneNumber).filter(Boolean))
    ];

    const secondaryContactIds = finalContacts
      .filter(c => c.linkPrecedence === "secondary")
      .map(c => c.id);

    return res.json({
      contact: {
        primaryContatctId: primaryId,
        emails,
        phoneNumbers,
        secondaryContactIds
      }
    });

  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
};
